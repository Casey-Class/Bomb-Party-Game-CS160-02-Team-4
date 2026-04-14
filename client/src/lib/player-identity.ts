export const PLAYER_NAME_STORAGE_KEY = "bomb-party-player-name";
export const PLAYER_ID_STORAGE_KEY = "bomb-party-player-id";

export function getStoredPlayerName() {
  if (typeof window === "undefined") {
    return "Player";
  }

  return localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim() || "Player";
}

export function storePlayerName(playerName: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedName = playerName.trim() || "Player";
  localStorage.setItem(PLAYER_NAME_STORAGE_KEY, normalizedName);
}

export function getStoredPlayerId() {
  if (typeof window === "undefined") {
    return "player-server";
  }

  const existingPlayerId = localStorage.getItem(PLAYER_ID_STORAGE_KEY)?.trim();

  if (existingPlayerId) {
    return existingPlayerId;
  }

  const nextPlayerId = crypto.randomUUID();
  localStorage.setItem(PLAYER_ID_STORAGE_KEY, nextPlayerId);

  return nextPlayerId;
}
