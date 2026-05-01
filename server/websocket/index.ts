import type { ServerWebSocket } from "bun";
import { verifyToken } from "../lib/jwt";
import { getUserById } from "../lib/auth";
import { buildAbsoluteUrl } from "../lib/http";
import { WebSocketGameService } from "./service";
import type { ServerEvent, SocketData } from "./types";
import "../db/init";
import { getDictionarySize } from "../words/dictionary";

console.log(`Loaded dictionary with ${getDictionarySize()} words`);

const clientsByRoom = new Map<string, Set<ServerWebSocket<SocketData>>>();
const roomServices = new Map<string, WebSocketGameService>();
const roomTickers = new Map<string, ReturnType<typeof setInterval>>();
const disconnectCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
const roomExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const roomCreatedAt = new Map<string, number>();
const DISCONNECT_GRACE_PERIOD_MS = 30_000;
const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;
const TICK_INTERVAL_MS = 1000;

function send(ws: ServerWebSocket<SocketData>, event: ServerEvent) {
  ws.send(JSON.stringify(event));
}

function getRoomClients(roomId: string) {
  let clients = clientsByRoom.get(roomId);

  if (!clients) {
    clients = new Set<ServerWebSocket<SocketData>>();
    clientsByRoom.set(roomId, clients);
  }

  return clients;
}

function getRoomService(roomId: string) {
  let roomService = roomServices.get(roomId);

  if (!roomService) {
    roomService = new WebSocketGameService(roomId);
    roomServices.set(roomId, roomService);
    roomCreatedAt.set(roomId, Date.now());
    scheduleRoomExpiry(roomId);
  }

  return roomService;
}

function getDisconnectKey(roomId: string, playerId: string) {
  return `${roomId}:${playerId}`;
}

function clearDisconnectCleanup(roomId: string, playerId: string) {
  const key = getDisconnectKey(roomId, playerId);
  const timeout = disconnectCleanupTimers.get(key);

  if (!timeout) {
    return;
  }

  clearTimeout(timeout);
  disconnectCleanupTimers.delete(key);
}

function ensureRoomTicker(roomId: string) {
  if (roomTickers.has(roomId)) {
    return;
  }

  const ticker = setInterval(() => {
    const response = getRoomService(roomId).tick();

    if (!response) {
      return;
    }

    broadcast(roomId, response);
  }, TICK_INTERVAL_MS);

  roomTickers.set(roomId, ticker);
}

function scheduleRoomExpiry(roomId: string) {
  const existingTimer = roomExpiryTimers.get(roomId);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const createdAt = roomCreatedAt.get(roomId) ?? Date.now();
  const expiresInMs = Math.max(0, createdAt + ROOM_LIFETIME_MS - Date.now());
  const expiryTimer = setTimeout(() => {
    expireRoom(roomId);
  }, expiresInMs);

  roomExpiryTimers.set(roomId, expiryTimer);
}

function teardownRoom(roomId: string) {
  const ticker = roomTickers.get(roomId);

  if (ticker) {
    clearInterval(ticker);
    roomTickers.delete(roomId);
  }

  const expiryTimer = roomExpiryTimers.get(roomId);

  if (expiryTimer) {
    clearTimeout(expiryTimer);
    roomExpiryTimers.delete(roomId);
  }

  for (const disconnectKey of disconnectCleanupTimers.keys()) {
    if (!disconnectKey.startsWith(`${roomId}:`)) {
      continue;
    }

    const timeout = disconnectCleanupTimers.get(disconnectKey);

    if (timeout) {
      clearTimeout(timeout);
    }

    disconnectCleanupTimers.delete(disconnectKey);
  }

  clientsByRoom.delete(roomId);
  roomServices.delete(roomId);
  roomCreatedAt.delete(roomId);
}

function expireRoom(roomId: string) {
  const clients = clientsByRoom.get(roomId);

  if (clients) {
    const payload = JSON.stringify({
      type: "error",
      payload: { message: "This room expired after 24 hours. Create a new room." },
    } satisfies ServerEvent);

    for (const client of clients) {
      client.data.roomWasExpired = true;
      client.send(payload);
      client.close(4001, "Room expired");
    }
  }

  teardownRoom(roomId);
}

function cleanupRoom(roomId: string) {
  const clients = clientsByRoom.get(roomId);
  const roomService = roomServices.get(roomId);

  if (clients && clients.size === 0) {
    clientsByRoom.delete(roomId);
  }

  if (roomService?.isEmpty()) {
    roomServices.delete(roomId);
    roomCreatedAt.delete(roomId);
  }

  if (!roomServices.has(roomId)) {
    teardownRoom(roomId);
  }
}

function broadcast(roomId: string, event: ServerEvent) {
  const clients = clientsByRoom.get(roomId);

  if (!clients) {
    return;
  }

  const payload = JSON.stringify(event);

  for (const client of clients) {
    client.send(payload);
  }
}

export async function handleWebSocketUpgrade(
  req: Request,
  server: Bun.Server<SocketData>,
) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId")?.trim().toUpperCase();
  const requestedPlayerName =
    url.searchParams.get("playerName")?.trim() || "Player";
  const requestedPlayerId = url.searchParams.get("playerId")?.trim();
  const token = url.searchParams.get("token")?.trim() || null;
  const payload = token ? verifyToken(token) : null;
  const playerId = payload ? `user-${payload.userId}` : requestedPlayerId;
  const playerName = payload?.username?.trim() || requestedPlayerName;
  const roomService = roomId ? getRoomService(roomId) : null;
  const authUser = payload ? await getUserById(payload.userId) : null;

  if (!roomId || !playerId || !roomService) {
    return false;
  }

  const createdAt = roomCreatedAt.get(roomId);

  if (createdAt && Date.now() - createdAt >= ROOM_LIFETIME_MS) {
    expireRoom(roomId);
    return false;
  }

  if (!roomService.canPlayerJoin(playerId)) {
    return false;
  }

  return server.upgrade(req, {
    data: {
      authUserId: payload?.userId ?? null,
      authAvatarColor: authUser?.avatar_color ?? null,
      authAvatarUrl: buildAbsoluteUrl(req, authUser?.avatar_url ?? null),
      authUsername: payload?.username ?? null,
      clientId: `client-${Math.floor(Math.random() * 1_000_000)}`,
      playerId,
      playerName,
      roomId,
    },
  });
}

export const websocket = {
  open(ws: ServerWebSocket<SocketData>) {
    const {
      authAvatarColor,
      authAvatarUrl,
      authUserId,
      playerId,
      playerName,
      roomId,
    } = ws.data;
    getRoomClients(roomId).add(ws);
    clearDisconnectCleanup(roomId, playerId);
    ensureRoomTicker(roomId);

    send(ws, {
      type: "connected",
      payload: { clientId: ws.data.clientId },
    });

    broadcast(roomId, {
      type: "state_sync",
      payload: getRoomService(roomId).connectPlayer(
        playerId,
        playerName,
        authUserId,
        authAvatarColor,
        authAvatarUrl,
      ),
    });
  },

  message(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
  const { playerId, roomId } = ws.data;
    const response = getRoomService(roomId).handleMessage(
      playerId,
      String(message),
    );

    if (!response) {
      return;
    }

    if (response.type === "state_sync") {
      broadcast(roomId, response);
      return;
    }

    send(ws, response);
  },

  close(ws: ServerWebSocket<SocketData>) {
    const { playerId, roomId, roomWasExpired } = ws.data;
    const roomClients = clientsByRoom.get(roomId);

    if (!roomClients) {
      return;
    }

    roomClients.delete(ws);

    if (roomWasExpired || !roomServices.has(roomId)) {
      cleanupRoom(roomId);
      return;
    }

    broadcast(roomId, {
      type: "state_sync",
      payload: getRoomService(roomId).markPlayerDisconnected(playerId),
    });

    const cleanupKey = getDisconnectKey(roomId, playerId);
    const cleanupTimer = setTimeout(() => {
      disconnectCleanupTimers.delete(cleanupKey);
      broadcast(roomId, {
        type: "state_sync",
        payload: getRoomService(roomId).removePlayer(playerId),
      });
      cleanupRoom(roomId);
    }, DISCONNECT_GRACE_PERIOD_MS);

    disconnectCleanupTimers.set(cleanupKey, cleanupTimer);

    cleanupRoom(roomId);
  },
};
