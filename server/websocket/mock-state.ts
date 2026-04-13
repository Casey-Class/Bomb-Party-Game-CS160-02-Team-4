import type { GameSnapshotDto, PlayerDto } from "./types";

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
];

export function createInitialSnapshot(roomCode: string): GameSnapshotDto {
  return {
    players: [],
    gameState: {
      currentSyllable: "OGI",
      timeLeft: 15,
      maxTime: 15,
      round: 1,
      currentPlayerId: "",
      turnDirection: "clockwise",
      status: "waiting",
    },
    chatMessages: [
      {
        id: "system-welcome",
        author: "System",
        text: "Waiting for players to connect.",
        timestamp: new Date().toISOString(),
        isSystem: true,
      },
    ],
    gameSettings: {
      maxPlayers: 20,
      timePerTurn: 15,
      startingLives: 3,
      minWordLength: 3,
      roomCode,
      isPublic: true,
    },
  };
}

export function createPlayer(clientId: string, playerName: string, playerCount: number): PlayerDto {
  return {
    id: clientId,
    name: playerName || `Player ${playerCount}`,
    avatarUrl: null,
    avatarColor: AVATAR_COLORS[(playerCount - 1) % AVATAR_COLORS.length] ?? "#607d8b",
    lives: 3,
    maxLives: 3,
    score: 0,
    isActive: false,
    isEliminated: false,
    currentWord: null,
  };
}
