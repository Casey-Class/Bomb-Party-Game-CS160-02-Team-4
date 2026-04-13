export interface PlayerDto {
  id: string;
  name: string;
  avatarUrl: string | null;
  avatarColor: string;
  lives: number;
  maxLives: number;
  score: number;
  isActive: boolean;
  isEliminated: boolean;
  currentWord: string | null;
}

export interface GameStateDto {
  currentSyllable: string;
  timeLeft: number;
  maxTime: number;
  round: number;
  currentPlayerId: string;
  turnDirection: "clockwise" | "counterclockwise";
  status: "waiting" | "playing" | "ended";
}

export interface ChatMessageDto {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isSystem: boolean;
}

export interface GameSettingsDto {
  maxPlayers: number;
  timePerTurn: number;
  startingLives: number;
  minWordLength: number;
  roomCode: string;
  isPublic: boolean;
}

export interface GameSnapshotDto {
  players: PlayerDto[];
  gameState: GameStateDto;
  chatMessages: ChatMessageDto[];
  gameSettings: GameSettingsDto;
}

export type ClientEvent =
  | {
      type: "typing_word";
      payload: { word: string };
    }
  | {
      type: "submit_word";
      payload: { word: string };
    }
  | {
      type: "send_chat";
      payload: { text: string };
    };

export type ServerEvent =
  | {
      type: "connected";
      payload: { clientId: string };
    }
  | {
      type: "state_sync";
      payload: GameSnapshotDto;
    }
  | {
      type: "error";
      payload: { message: string };
    };

export interface SocketData {
  clientId: string;
}
