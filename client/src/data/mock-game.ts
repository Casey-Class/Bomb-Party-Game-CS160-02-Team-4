export interface Player {
  id: string
  name: string
  avatarUrl: string | null
  avatarColor: string
  lives: number
  maxLives: number
  score: number
  isActive: boolean
  isEliminated: boolean
  currentWord: string | null
}

export interface GameState {
  currentSyllable: string
  timeLeft: number
  maxTime: number
  round: number
  currentPlayerId: string
  turnDirection: "clockwise" | "counterclockwise"
  status: "waiting" | "playing" | "ended"
}

export interface ChatMessage {
  id: string
  author: string
  text: string
  timestamp: Date
  isSystem: boolean
}

export interface GameSettings {
  maxPlayers: number
  timePerTurn: number
  startingLives: number
  minWordLength: number
  roomCode: string
  isPublic: boolean
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
]

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
    currentWord: "LOGGING",
  },
]

export const mockGameState: GameState = {
  currentSyllable: "OGI",
  timeLeft: 7,
  maxTime: 15,
  round: 4,
  currentPlayerId: "p5",
  turnDirection: "clockwise",
  status: "playing",
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: "c1",
    author: "System",
    text: "Game started! Round 1",
    timestamp: new Date(Date.now() - 300000),
    isSystem: true,
  },
  {
    id: "c2",
    author: "Alex",
    text: "good luck everyone!",
    timestamp: new Date(Date.now() - 280000),
    isSystem: false,
  },
  {
    id: "c3",
    author: "Jordan",
    text: "let's go!",
    timestamp: new Date(Date.now() - 250000),
    isSystem: false,
  },
  {
    id: "c4",
    author: "System",
    text: "Morgan has been eliminated!",
    timestamp: new Date(Date.now() - 200000),
    isSystem: true,
  },
  {
    id: "c5",
    author: "Jamie",
    text: "nice try Morgan",
    timestamp: new Date(Date.now() - 180000),
    isSystem: false,
  },
  {
    id: "c6",
    author: "Casey",
    text: "these syllables are tricky",
    timestamp: new Date(Date.now() - 120000),
    isSystem: false,
  },
  {
    id: "c7",
    author: "System",
    text: "Round 4 started!",
    timestamp: new Date(Date.now() - 60000),
    isSystem: true,
  },
  {
    id: "c8",
    author: "Sam",
    text: "this is so fun",
    timestamp: new Date(Date.now() - 30000),
    isSystem: false,
  },
  {
    id: "c9",
    author: "Riley",
    text: "good game everyone",
    timestamp: new Date(Date.now() - 15000),
    isSystem: false,
  },
]

export const mockGameSettings: GameSettings = {
  maxPlayers: 20,
  timePerTurn: 15,
  startingLives: 3,
  minWordLength: 3,
  roomCode: "BOMB-42X",
  isPublic: true,
}
