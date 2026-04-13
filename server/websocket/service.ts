import { createInitialSnapshot, createPlayer } from "./mock-state";
import { isValidDictionaryWord } from "../words/dictionary";
import type {
  ChatMessageDto,
  ClientEvent,
  GameSnapshotDto,
  PlayerDto,
  ServerEvent,
} from "./types";

export class WebSocketGameService {
  private snapshot: GameSnapshotDto;
  private readonly usedWords = new Set<string>();

  public constructor(private readonly roomId: string) {
    this.snapshot = createInitialSnapshot(roomId);
  }

  public getSnapshot(): GameSnapshotDto {
    return structuredClone(this.snapshot);
  }

  public connectPlayer(clientId: string, playerName: string): GameSnapshotDto {
    const existingPlayer = this.resolvePlayer(clientId);

    if (existingPlayer) {
      return this.getSnapshot();
    }

    const player = createPlayer(clientId, playerName, this.snapshot.players.length + 1);
    const players = [...this.snapshot.players, player];
    const currentPlayerId = this.snapshot.gameState.currentPlayerId || player.id;

    this.snapshot = {
      ...this.snapshot,
      players: players.map((connectedPlayer) => ({
        ...connectedPlayer,
        isActive: connectedPlayer.id === currentPlayerId,
      })),
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId,
        status: "playing",
      },
      chatMessages: [
        ...this.snapshot.chatMessages,
        this.createSystemMessage(`${player.name} joined the room.`),
      ],
    };

    return this.getSnapshot();
  }

  public isEmpty() {
    return this.snapshot.players.length === 0;
  }

  public disconnectPlayer(clientId: string): GameSnapshotDto {
    const departingPlayer = this.resolvePlayer(clientId);

    if (!departingPlayer) {
      return this.getSnapshot();
    }

    const players = this.snapshot.players.filter((player) => player.id !== clientId);
    const currentPlayerStillExists = players.some(
      (player) => player.id === this.snapshot.gameState.currentPlayerId,
    );
    const currentPlayerId = currentPlayerStillExists
      ? this.snapshot.gameState.currentPlayerId
      : players[0]?.id || "";

    this.snapshot = {
      ...this.snapshot,
      players: players.map((player) => ({
        ...player,
        isActive: player.id === currentPlayerId,
      })),
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId,
        status: players.length > 0 ? "playing" : "waiting",
        timeLeft: players.length > 0 ? this.snapshot.gameState.timeLeft : this.snapshot.gameState.maxTime,
      },
      chatMessages: [
        ...this.snapshot.chatMessages,
        this.createSystemMessage(`${departingPlayer.name} left the room.`),
      ],
    };

    return this.getSnapshot();
  }

  public handleMessage(clientId: string, rawMessage: string): ServerEvent | null {
    let event: ClientEvent;

    try {
      event = JSON.parse(rawMessage) as ClientEvent;
    } catch {
      return {
        type: "error",
        payload: { message: "Invalid JSON payload" },
      };
    }

    switch (event.type) {
      case "typing_word":
        return this.handleTypingWord(clientId, event.payload.word);
      case "submit_word":
        return this.handleSubmitWord(clientId, event.payload.word);
      case "send_chat":
        return this.handleSendChat(clientId, event.payload.text);
      default:
        return {
          type: "error",
          payload: { message: "Unsupported event type" },
        };
    }
  }

  private handleTypingWord(clientId: string, word: string): ServerEvent {
    const activePlayer = this.resolvePlayer(this.snapshot.gameState.currentPlayerId);
    const typingPlayer = this.resolvePlayer(clientId);

    if (!activePlayer || !typingPlayer || typingPlayer.id !== activePlayer.id) {
      return {
        type: "error",
        payload: { message: "It is not your turn" },
      };
    }

    const draftWord = word.trim().toUpperCase();

    this.snapshot = {
      ...this.snapshot,
      players: this.snapshot.players.map((player) =>
        player.id === typingPlayer.id
          ? {
              ...player,
              currentWord: draftWord || null,
            }
          : player,
      ),
    };

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleSubmitWord(clientId: string, word: string): ServerEvent {
    const trimmedWord = word.trim().toUpperCase();
    const activePlayer = this.resolvePlayer(this.snapshot.gameState.currentPlayerId);
    const submittingPlayer = this.resolvePlayer(clientId);
    const currentSyllable = this.snapshot.gameState.currentSyllable.toUpperCase();
    const minWordLength = this.snapshot.gameSettings.minWordLength;

    if (!trimmedWord) {
      return {
        type: "error",
        payload: { message: "Word cannot be empty" },
      };
    }

    if (!activePlayer || !submittingPlayer) {
      return {
        type: "error",
        payload: { message: "No active player found" },
      };
    }

    if (submittingPlayer.id !== activePlayer.id) {
      return {
        type: "error",
        payload: { message: "It is not your turn" },
      };
    }

    if (trimmedWord.length < minWordLength) {
      return {
        type: "error",
        payload: {
          message: `Word must be at least ${minWordLength} letters`,
        },
      };
    }

    if (!trimmedWord.includes(currentSyllable)) {
      return {
        type: "error",
        payload: {
          message: `Word must contain ${currentSyllable}`,
        },
      };
    }

    if (!isValidDictionaryWord(trimmedWord)) {
      return {
        type: "error",
        payload: { message: `${trimmedWord} is not in the dictionary` },
      };
    }

    if (this.usedWords.has(trimmedWord)) {
      return {
        type: "error",
        payload: { message: `${trimmedWord} has already been played` },
      };
    }

    const updatedPlayers = this.snapshot.players.map((player) =>
      player.id === activePlayer.id
        ? {
            ...player,
            currentWord: trimmedWord,
            score: player.score + trimmedWord.length,
          }
        : player,
    );
    const nextTurn = this.getNextTurnState(updatedPlayers);

    this.snapshot = {
      ...this.snapshot,
      players: nextTurn.players,
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId: nextTurn.currentPlayerId,
        timeLeft: this.snapshot.gameState.maxTime,
        status: "playing",
      },
      chatMessages: [
        ...this.snapshot.chatMessages,
        this.createSystemMessage(`${activePlayer.name} played ${trimmedWord}`),
      ],
    };
    this.usedWords.add(trimmedWord);

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleSendChat(clientId: string, text: string): ServerEvent {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return {
        type: "error",
        payload: { message: "Message cannot be empty" },
      };
    }

    const player = this.resolvePlayer(clientId);
    const author = player?.name ?? "You";

    this.snapshot = {
      ...this.snapshot,
      chatMessages: [
        ...this.snapshot.chatMessages,
        {
          id: `c${Date.now()}`,
          author,
          text: trimmedText,
          timestamp: new Date().toISOString(),
          isSystem: false,
        },
      ],
    };

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private getNextTurnState(players: PlayerDto[]) {
    const currentIndex = players.findIndex(
      (player) => player.id === this.snapshot.gameState.currentPlayerId,
    );

    if (currentIndex === -1 || players.length === 0) {
      return {
        players,
        currentPlayerId: this.snapshot.gameState.currentPlayerId,
      };
    }

    const nextPlayer = players[(currentIndex + 1) % players.length];

    if (!nextPlayer) {
      return {
        players,
        currentPlayerId: this.snapshot.gameState.currentPlayerId,
      };
    }

    return {
      players: players.map((player) => ({
        ...player,
        isActive: player.id === nextPlayer.id,
      })),
      currentPlayerId: nextPlayer.id,
    };
  }

  private resolvePlayer(clientId: string): PlayerDto | undefined {
    return this.snapshot.players.find((player) => player.id === clientId);
  }

  private createSystemMessage(text: string): ChatMessageDto {
    return {
      id: `c${Date.now()}`,
      author: "System",
      text,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
  }
}
