export const PLAYER_NAME_STORAGE_KEY = "bomb-party-player-name"

export function getStoredPlayerName() {
  if (typeof window === "undefined") {
    return "Player"
  }

  return localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim() || "Player"
}

export function storePlayerName(playerName: string) {
  if (typeof window === "undefined") {
    return
  }

  const normalizedName = playerName.trim() || "Player"
  localStorage.setItem(PLAYER_NAME_STORAGE_KEY, normalizedName)
}
