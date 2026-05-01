export const PLAYER_NAME_STORAGE_KEY = "bomb-party-player-name";
export const PLAYER_ID_STORAGE_KEY = "bomb-party-player-id";
const LEGACY_GUEST_NAMES = new Set(["Guest", "Player"]);

function generateGuestSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export function generateGuestName() {
  return `Guest_${generateGuestSuffix()}`;
}

export function getStoredPlayerName() {
  if (typeof window === "undefined") {
    return generateGuestName();
  }

  const storedPlayerName = localStorage
    .getItem(PLAYER_NAME_STORAGE_KEY)
    ?.trim();

  if (storedPlayerName && !LEGACY_GUEST_NAMES.has(storedPlayerName)) {
    return storedPlayerName;
  }

  const generatedGuestName = generateGuestName();
  localStorage.setItem(PLAYER_NAME_STORAGE_KEY, generatedGuestName);
  return generatedGuestName;
}

export function storePlayerName(playerName: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedPlayerName = playerName.trim();
  const normalizedName =
    trimmedPlayerName && !LEGACY_GUEST_NAMES.has(trimmedPlayerName)
      ? trimmedPlayerName
      : generateGuestName();
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

export function getSocketPlayerId(userId?: number | null) {
  if (typeof userId === "number" && Number.isFinite(userId) && userId > 0) {
    return `user-${userId}`;
  }

  return getStoredPlayerId();
}
