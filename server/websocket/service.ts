import { createInitialSnapshot, createPlayer } from "./mock-state";
import { recordCompletedGameForUsers } from "../lib/auth";
import { getRandomSyllable, isValidDictionaryWord } from "../words/dictionary";
import type {
  ChatMessageDto,
  ClientEvent,
  GameSnapshotDto,
  PlayerDto,
  ServerEvent,
} from "./types";

interface TurnState {
  currentPlayerId: string;
  didWrap: boolean;
}

interface TurnUpdateOptions {
  currentPlayerId: string;
  didWrap: boolean;
  players: PlayerDto[];
}

export class WebSocketGameService {
  private snapshot: GameSnapshotDto;
  private hasRecordedCurrentGame = false;
  private readonly usedWords = new Set<string>();

  public constructor(private readonly roomId: string) {
    this.snapshot = createInitialSnapshot(roomId);
  }

  public getSnapshot(): GameSnapshotDto {
    return structuredClone(this.snapshot);
  }

  public canPlayerJoin(playerId: string) {
    return (
      this.snapshot.players.some((player) => player.id === playerId) ||
      this.snapshot.players.length < this.snapshot.gameSettings.maxPlayers
    );
  }

  public connectPlayer(
    playerId: string,
    playerName: string,
    userId: number | null,
    avatarColor?: string | null,
    avatarUrl?: string | null,
  ): GameSnapshotDto {
    const existingPlayer = this.resolvePlayer(playerId);
    const nextPlayerName = playerName.trim();

    if (existingPlayer) {
      this.snapshot = {
        ...this.snapshot,
        players: this.snapshot.players.map((player) =>
          player.id === playerId
            ? {
                ...player,
                name: nextPlayerName || player.name,
                userId,
                avatarColor: avatarColor || player.avatarColor,
                avatarUrl: avatarUrl ?? player.avatarUrl,
                isConnected: true,
              }
            : player,
        ),
        chatMessages: [
          ...this.snapshot.chatMessages,
          this.createSystemMessage(`${existingPlayer.name} reconnected.`),
        ],
      };

      return this.getSnapshot();
    }

    const player = createPlayer(
      playerId,
      playerName,
      this.snapshot.players.length + 1,
      userId,
      this.snapshot.gameSettings.startingLives,
      avatarColor ?? undefined,
      avatarUrl ?? undefined,
    );

    this.snapshot = {
      ...this.snapshot,
      players: [...this.snapshot.players, player],
      gameSettings: {
        ...this.snapshot.gameSettings,
        hostPlayerId:
          this.snapshot.gameSettings.hostPlayerId || player.id,
      },
      chatMessages: [
        ...this.snapshot.chatMessages,
        this.createSystemMessage(`${player.name} joined the room.`),
      ],
    };

    return this.getSnapshot();
  }

  public markPlayerDisconnected(playerId: string): GameSnapshotDto {
    const departingPlayer = this.resolvePlayer(playerId);

    if (!departingPlayer) {
      return this.getSnapshot();
    }

    this.snapshot = {
      ...this.snapshot,
      players: this.snapshot.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              isConnected: false,
            }
          : player,
      ),
      chatMessages: [
        ...this.snapshot.chatMessages,
        this.createSystemMessage(`${departingPlayer.name} disconnected.`),
      ],
    };

    return this.getSnapshot();
  }

  public removePlayer(playerId: string): GameSnapshotDto {
    const departingPlayer = this.resolvePlayer(playerId);

    if (!departingPlayer) {
      return this.getSnapshot();
    }

    const previousPlayers = this.snapshot.players;
    const removedIndex = previousPlayers.findIndex((player) => player.id === playerId);
    const players = previousPlayers.filter((player) => player.id !== playerId);
    const alivePlayers = players.filter((player) => !player.isEliminated);

    if (players.length === 0) {
      this.usedWords.clear();
      this.snapshot = createInitialSnapshot(this.roomId);

      return this.getSnapshot();
    }

    if (this.snapshot.gameState.status === "playing" && alivePlayers.length <= 1) {
      const winner = alivePlayers[0];
      this.snapshot = this.createEndedSnapshot(players, winner?.id ?? null);
      this.appendSystemMessage(`${departingPlayer.name} left the room.`);

      return this.getSnapshot();
    }

    const currentPlayerId = this.getCurrentPlayerIdAfterRemoval({
      playerId,
      players,
      removedIndex,
    });
    const didWrap =
      currentPlayerId !== "" &&
      currentPlayerId !== this.snapshot.gameState.currentPlayerId &&
      this.findNextEligiblePlayer(players, removedIndex).didWrap;
    const isPlaying = this.snapshot.gameState.status === "playing";
    const nextStatus =
      isPlaying && alivePlayers.length >= 2
        ? "playing"
        : this.snapshot.gameState.status === "ended"
          ? "ended"
          : "waiting";

    this.snapshot = {
      ...this.snapshot,
      players: players.map((player) => ({
        ...player,
        isActive: nextStatus === "playing" && !player.isEliminated && player.id === currentPlayerId,
      })),
      gameSettings: {
        ...this.snapshot.gameSettings,
        hostPlayerId:
          this.snapshot.gameSettings.hostPlayerId === playerId
            ? (players[0]?.id ?? "")
            : this.snapshot.gameSettings.hostPlayerId,
      },
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId,
        round: isPlaying && didWrap ? this.snapshot.gameState.round + 1 : this.snapshot.gameState.round,
        status: nextStatus,
        timeLeft: isPlaying ? this.snapshot.gameState.timeLeft : this.snapshot.gameState.maxTime,
      },
    };
    this.appendSystemMessage(`${departingPlayer.name} left the room.`);

    return this.getSnapshot();
  }

  public isEmpty() {
    return this.snapshot.players.length === 0;
  }

  public handleMessage(playerId: string, rawMessage: string): ServerEvent | null {
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
      case "start_game":
        return this.handleStartGame(playerId);
      case "typing_word":
        return this.handleTypingWord(playerId, event.payload.word);
      case "submit_word":
        return this.handleSubmitWord(playerId, event.payload.word);
      case "send_chat":
        return this.handleSendChat(playerId, event.payload.text);
      case "update_settings":
        return this.handleUpdateSettings(
          playerId,
          event.payload.timePerTurn,
          event.payload.startingLives,
        );
      default:
        return {
          type: "error",
          payload: { message: "Unsupported event type" },
        };
    }
  }

  public tick(): ServerEvent | null {
    if (this.snapshot.gameState.status !== "playing") {
      return null;
    }

    const activePlayer = this.resolvePlayer(this.snapshot.gameState.currentPlayerId);

    if (!activePlayer || activePlayer.isEliminated) {
      return {
        type: "state_sync",
        payload: this.realignActiveTurn(),
      };
    }

    if (this.snapshot.gameState.timeLeft > 1) {
      this.snapshot = this.updateGameState({
        timeLeft: this.snapshot.gameState.timeLeft - 1,
      });

      return {
        type: "state_sync",
        payload: this.getSnapshot(),
      };
    }

    return {
      type: "state_sync",
      payload: this.handleTurnTimeout(activePlayer.id),
    };
  }

  private handleStartGame(playerId: string): ServerEvent {
    if (this.snapshot.gameState.status === "playing") {
      return {
        type: "error",
        payload: { message: "Game already started" },
      };
    }

    const player = this.resolvePlayer(playerId);

    if (!player) {
      return {
        type: "error",
        payload: { message: "Player not found" },
      };
    }

    const connectedPlayers = this.snapshot.players.filter((candidate) => candidate.isConnected);

    if (connectedPlayers.length < 2) {
      return {
        type: "error",
        payload: { message: "Need at least 2 players to start" },
      };
    }

    const startingPlayer = connectedPlayers[0];

    if (!startingPlayer) {
      return {
        type: "error",
        payload: { message: "Unable to determine starting player" },
      };
    }

    this.snapshot = {
      ...this.snapshot,
      players: this.snapshot.players.map((candidate) => ({
        ...candidate,
        currentWord: null,
        isActive: candidate.id === startingPlayer.id,
        isEliminated: false,
        lives: this.snapshot.gameSettings.startingLives,
        maxLives: this.snapshot.gameSettings.startingLives,
        score: 0,
      })),
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId: startingPlayer.id,
        currentSyllable: getRandomSyllable(),
        timeLeft: this.snapshot.gameSettings.timePerTurn,
        maxTime: this.snapshot.gameSettings.timePerTurn,
        round: 1,
        winnerId: null,
        status: "playing",
      },
    };
    this.usedWords.clear();
    this.hasRecordedCurrentGame = false;
    this.appendSystemMessage(`${player.name} started the game.`);

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleTypingWord(playerId: string, word: string): ServerEvent {
    const activePlayer = this.resolvePlayer(this.snapshot.gameState.currentPlayerId);
    const typingPlayer = this.resolvePlayer(playerId);

    if (this.snapshot.gameState.status !== "playing") {
      return {
        type: "error",
        payload: { message: "Game has not started" },
      };
    }

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

  private handleSubmitWord(playerId: string, word: string): ServerEvent {
    const trimmedWord = word.trim().toUpperCase();
    const activePlayer = this.resolvePlayer(this.snapshot.gameState.currentPlayerId);
    const submittingPlayer = this.resolvePlayer(playerId);
    const currentSyllable = this.snapshot.gameState.currentSyllable.toUpperCase();
    const minWordLength = this.snapshot.gameSettings.minWordLength;

    if (this.snapshot.gameState.status !== "playing") {
      return {
        type: "error",
        payload: { message: "Game has not started" },
      };
    }

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

    this.usedWords.add(trimmedWord);

    const updatedPlayers = this.snapshot.players.map((player) =>
      player.id === activePlayer.id
        ? {
            ...player,
            currentWord: null,
            score: player.score + trimmedWord.length,
          }
        : {
            ...player,
            currentWord: null,
          },
    );
    const nextTurn = this.findNextEligiblePlayer(updatedPlayers, this.getPlayerIndex(activePlayer.id));

    this.applyTurnUpdate({
      ...nextTurn,
      players: updatedPlayers,
    });
    this.appendSystemMessage(`${activePlayer.name} played ${trimmedWord}.`);

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleSendChat(playerId: string, text: string): ServerEvent {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return {
        type: "error",
        payload: { message: "Message cannot be empty" },
      };
    }

    const player = this.resolvePlayer(playerId);
    const author = player?.name ?? "Player";

    this.snapshot = {
      ...this.snapshot,
      chatMessages: [...this.snapshot.chatMessages, this.createChatMessage(author, trimmedText)],
    };

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleUpdateSettings(
    playerId: string,
    timePerTurn: number,
    startingLives: number,
  ): ServerEvent {
    const player = this.resolvePlayer(playerId);

    if (!player) {
      return {
        type: "error",
        payload: { message: "Player not found" },
      };
    }

    if (playerId !== this.snapshot.gameSettings.hostPlayerId) {
      return {
        type: "error",
        payload: { message: "Only the room host can change settings" },
      };
    }

    if (this.snapshot.gameState.status !== "waiting") {
      return {
        type: "error",
        payload: { message: "Settings can only be changed in the lobby" },
      };
    }

    const nextTimePerTurn = Math.trunc(timePerTurn);
    const nextStartingLives = Math.trunc(startingLives);

    if (!Number.isFinite(nextTimePerTurn) || nextTimePerTurn < 5 || nextTimePerTurn > 120) {
      return {
        type: "error",
        payload: { message: "Time per turn must be between 5 and 120 seconds" },
      };
    }

    if (!Number.isFinite(nextStartingLives) || nextStartingLives < 1 || nextStartingLives > 10) {
      return {
        type: "error",
        payload: { message: "Starting lives must be between 1 and 10" },
      };
    }

    this.snapshot = {
      ...this.snapshot,
      players: this.snapshot.players.map((candidate) => ({
        ...candidate,
        lives: nextStartingLives,
        maxLives: nextStartingLives,
        isEliminated: false,
        isActive: false,
        currentWord: null,
      })),
      gameSettings: {
        ...this.snapshot.gameSettings,
        timePerTurn: nextTimePerTurn,
        startingLives: nextStartingLives,
      },
      gameState: {
        ...this.snapshot.gameState,
        timeLeft: nextTimePerTurn,
        maxTime: nextTimePerTurn,
        currentPlayerId: "",
        winnerId: null,
      },
    };
    this.appendSystemMessage(
      `${player.name} updated the room settings: ${nextTimePerTurn}s, ${nextStartingLives} lives.`,
    );

    return {
      type: "state_sync",
      payload: this.getSnapshot(),
    };
  }

  private handleTurnTimeout(activePlayerId: string) {
    const activePlayer = this.resolvePlayer(activePlayerId);

    if (!activePlayer) {
      return this.realignActiveTurn();
    }

    const remainingLives = Math.max(activePlayer.lives - 1, 0);
    const eliminated = remainingLives === 0;
    const updatedPlayers = this.snapshot.players.map((player) =>
      player.id === activePlayer.id
        ? {
            ...player,
            currentWord: null,
            lives: remainingLives,
            isEliminated: eliminated,
          }
        : player,
    );
    const alivePlayers = updatedPlayers.filter((player) => !player.isEliminated);

    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0];
      const endedSnapshot = this.createEndedSnapshot(updatedPlayers, winner?.id ?? null);
      this.snapshot = {
        ...endedSnapshot,
        chatMessages: [
          ...endedSnapshot.chatMessages,
          this.createSystemMessage(
            eliminated
              ? `${activePlayer.name} was eliminated.`
              : `${activePlayer.name} ran out of time.`,
          ),
        ],
      };

      return this.getSnapshot();
    }

    const nextTurn = this.findNextEligiblePlayer(updatedPlayers, this.getPlayerIndex(activePlayer.id));
    this.applyTurnUpdate({
      ...nextTurn,
      players: updatedPlayers,
    });
    this.appendSystemMessage(`${activePlayer.name} ran out of time and lost a life.`);

    if (eliminated) this.appendSystemMessage(`${activePlayer.name} was eliminated.`);

    return this.getSnapshot();
  }

  private realignActiveTurn() {
    const alivePlayers = this.snapshot.players.filter((player) => !player.isEliminated);

    if (alivePlayers.length <= 1) {
      const winner = alivePlayers[0];
      this.snapshot = this.createEndedSnapshot(this.snapshot.players, winner?.id ?? null);

      return this.getSnapshot();
    }

    const nextTurn = this.findNextEligiblePlayer(
      this.snapshot.players,
      Math.max(this.getPlayerIndex(this.snapshot.gameState.currentPlayerId), 0),
    );
    this.applyTurnUpdate({
      ...nextTurn,
      players: this.snapshot.players,
    });

    return this.getSnapshot();
  }

  private createEndedSnapshot(players: PlayerDto[], winnerId: string | null) {
    const winner = winnerId ? players.find((player) => player.id === winnerId) : undefined;

    this.recordCompletedGame(players, winner?.userId ?? null);

    return {
      ...this.snapshot,
      players: players.map((player) => ({
        ...player,
        currentWord: null,
        isActive: false,
      })),
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId: "",
        winnerId,
        status: "ended" as const,
        timeLeft: 0,
      },
      chatMessages: winner
        ? [
            ...this.snapshot.chatMessages,
            this.createSystemMessage(`${winner.name} wins the game.`),
          ]
        : this.snapshot.chatMessages,
    };
  }

  private findNextEligiblePlayer(players: PlayerDto[], currentIndex: number): TurnState {
    const eligiblePlayers = players.filter((player) => !player.isEliminated);

    if (eligiblePlayers.length === 0) {
      return {
        currentPlayerId: "",
        didWrap: false,
      };
    }

    const totalPlayers = players.length;

    for (let offset = 1; offset <= totalPlayers; offset += 1) {
      const index = (currentIndex + offset + totalPlayers) % totalPlayers;
      const candidate = players[index];

      if (!candidate || candidate.isEliminated) {
        continue;
      }

      return {
        currentPlayerId: candidate.id,
        didWrap: index <= currentIndex,
      };
    }

    return {
      currentPlayerId: eligiblePlayers[0]?.id ?? "",
      didWrap: false,
    };
  }

  private getPlayerIndex(playerId: string) {
    return this.snapshot.players.findIndex((player) => player.id === playerId);
  }

  private getCurrentPlayerIdAfterRemoval({
    playerId,
    players,
    removedIndex,
  }: {
    playerId: string;
    players: PlayerDto[];
    removedIndex: number;
  }) {
    const currentPlayerId = this.snapshot.gameState.currentPlayerId;

    if (currentPlayerId === playerId) {
      return this.findNextEligiblePlayer(players, removedIndex).currentPlayerId;
    }

    if (players.some((player) => player.id === currentPlayerId)) {
      return currentPlayerId;
    }

    return "";
  }

  private applyTurnUpdate({ currentPlayerId, didWrap, players }: TurnUpdateOptions) {
    this.snapshot = {
      ...this.snapshot,
      players: players.map((player) => ({
        ...player,
        currentWord: null,
        isActive: player.id === currentPlayerId,
      })),
      gameState: {
        ...this.snapshot.gameState,
        currentPlayerId,
        currentSyllable: getRandomSyllable(),
        timeLeft: this.snapshot.gameSettings.timePerTurn,
        maxTime: this.snapshot.gameSettings.timePerTurn,
        round: didWrap ? this.snapshot.gameState.round + 1 : this.snapshot.gameState.round,
        status: "playing",
      },
    };
  }

  private updateGameState(nextGameState: Partial<GameSnapshotDto["gameState"]>) {
    return {
      ...this.snapshot,
      gameState: {
        ...this.snapshot.gameState,
        ...nextGameState,
      },
    };
  }

  private resolvePlayer(playerId: string): PlayerDto | undefined {
    return this.snapshot.players.find((player) => player.id === playerId);
  }

  private recordCompletedGame(players: PlayerDto[], winnerUserId: number | null) {
    if (this.hasRecordedCurrentGame) {
      return;
    }

    this.hasRecordedCurrentGame = true;

    if (players.length === 0) {
      return;
    }

    recordCompletedGameForUsers({
      winnerUserId,
      participants: players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        userId: player.userId,
      })),
      finishedAt: new Date().toISOString(),
    });
  }

  private appendSystemMessage(text: string) {
    this.snapshot = {
      ...this.snapshot,
      chatMessages: [...this.snapshot.chatMessages, this.createSystemMessage(text)],
    };
  }

  private createChatMessage(author: string, text: string): ChatMessageDto {
    return {
      id: `c${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      text,
      timestamp: new Date().toISOString(),
      isSystem: false,
    };
  }

  private createSystemMessage(text: string): ChatMessageDto {
    return {
      id: `c${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: "System",
      text,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
  }
}
