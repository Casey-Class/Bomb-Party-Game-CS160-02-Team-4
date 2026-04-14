export interface Player {
  avatarColor: string;
  avatarUrl: string | null;
  currentWord: string | null;
  id: string;
  isActive: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  lives: number;
  maxLives: number;
  name: string;
  score: number;
}

export interface GameState {
  currentPlayerId: string;
  currentSyllable: string;
  maxTime: number;
  round: number;
  status: "waiting" | "playing" | "ended";
  timeLeft: number;
  turnDirection: "clockwise" | "counterclockwise";
  winnerId: string | null;
}

export interface ChatMessage {
  author: string;
  id: string;
  isSystem: boolean;
  text: string;
  timestamp: Date;
}

export interface GameSettings {
  isPublic: boolean;
  maxPlayers: number;
  minWordLength: number;
  roomCode: string;
  startingLives: number;
  timePerTurn: number;
}

const AVATAR_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#e91e63",
  "#00bcd4",
  "#8bc34a",
  "#ff5722",
  "#607d8b",
  "#795548",
  "#ffc107",
  "#673ab7",
  "#009688",
  "#ff9800",
  "#03a9f4",
  "#cddc39",
  "#f44336",
];

export const mockPlayers: Player[] = [
  {
    id: "p1",
    name: "Alex",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[0],
    lives: 3,
    maxLives: 3,
    score: 245,
    isActive: false,
    isEliminated: false,
    isConnected: true,
    currentWord: "QUEST",
  },
  {
    id: "p2",
    name: "Jordan",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[1],
    lives: 3,
    maxLives: 3,
    score: 312,
    isActive: false,
    isEliminated: false,
    isConnected: true,
    currentWord: "TELLERS",
  },
  {
    id: "p3",
    name: "Taylor",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[2],
    lives: 0,
    maxLives: 3,
    score: 58,
    isActive: false,
    isEliminated: true,
    isConnected: true,
    currentWord: "MEDIAN",
  },
  {
    id: "p4",
    name: "Morgan",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[3],
    lives: 0,
    maxLives: 3,
    score: 42,
    isActive: false,
    isEliminated: true,
    isConnected: true,
    currentWord: null,
  },
  {
    id: "p5",
    name: "Casey",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[4],
    lives: 2,
    maxLives: 3,
    score: 189,
    isActive: true,
    isEliminated: false,
    isConnected: true,
    currentWord: null,
  },
  {
    id: "p6",
    name: "Riley",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[5],
    lives: 0,
    maxLives: 3,
    score: 15,
    isActive: false,
    isEliminated: true,
    isConnected: true,
    currentWord: null,
  },
  {
    id: "p7",
    name: "Sam",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[6],
    lives: 1,
    maxLives: 3,
    score: 167,
    isActive: false,
    isEliminated: false,
    isConnected: true,
    currentWord: "JOGGING",
  },
  {
    id: "p8",
    name: "Dakota",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[7],
    lives: 0,
    maxLives: 3,
    score: 33,
    isActive: false,
    isEliminated: true,
    isConnected: true,
    currentWord: null,
  },
  {
    id: "p9",
    name: "Jamie",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[8],
    lives: 2,
    maxLives: 3,
    score: 201,
    isActive: false,
    isEliminated: false,
    isConnected: true,
    currentWord: "LOGICAL",
  },
  {
    id: "p10",
    name: "Avery",
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[9],
    lives: 2,
    maxLives: 3,
    score: 178,
    isActive: false,
    isEliminated: false,
    isConnected: true,
    currentWord: "LOGGING",
  },
];

export const mockGameState: GameState = {
  currentSyllable: "OGI",
  timeLeft: 7,
  maxTime: 15,
  round: 4,
  currentPlayerId: "p5",
  winnerId: null,
  turnDirection: "clockwise",
  status: "playing",
};

export const mockChatMessages: ChatMessage[] = [
  {
    id: "c1",
    author: "System",
    text: "Game started! Round 1",
    timestamp: new Date(Date.now() - 300_000),
    isSystem: true,
  },
  {
    id: "c2",
    author: "Alex",
    text: "good luck everyone!",
    timestamp: new Date(Date.now() - 280_000),
    isSystem: false,
  },
  {
    id: "c3",
    author: "Jordan",
    text: "let's go!",
    timestamp: new Date(Date.now() - 250_000),
    isSystem: false,
  },
  {
    id: "c4",
    author: "System",
    text: "Morgan has been eliminated!",
    timestamp: new Date(Date.now() - 200_000),
    isSystem: true,
  },
  {
    id: "c5",
    author: "Jamie",
    text: "nice try Morgan",
    timestamp: new Date(Date.now() - 180_000),
    isSystem: false,
  },
  {
    id: "c6",
    author: "Casey",
    text: "these syllables are tricky",
    timestamp: new Date(Date.now() - 120_000),
    isSystem: false,
  },
  {
    id: "c7",
    author: "System",
    text: "Round 4 started!",
    timestamp: new Date(Date.now() - 60_000),
    isSystem: true,
  },
  {
    id: "c8",
    author: "Sam",
    text: "this is so fun",
    timestamp: new Date(Date.now() - 30_000),
    isSystem: false,
  },
  {
    id: "c9",
    author: "Riley",
    text: "good game everyone",
    timestamp: new Date(Date.now() - 15_000),
    isSystem: false,
  },
];

export const mockGameSettings: GameSettings = {
  maxPlayers: 20,
  timePerTurn: 15,
  startingLives: 3,
  minWordLength: 3,
  roomCode: "BOMB-42X",
  isPublic: true,
};
