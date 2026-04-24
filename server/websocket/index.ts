import type { ServerWebSocket } from "bun";
import { WebSocketGameService } from "./service";
import type { ServerEvent, SocketData } from "./types";

const clientsByRoom = new Map<string, Set<ServerWebSocket<SocketData>>>();
const roomServices = new Map<string, WebSocketGameService>();
const roomTickers = new Map<string, ReturnType<typeof setInterval>>();
const disconnectCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DISCONNECT_GRACE_PERIOD_MS = 30_000;
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

function cleanupRoom(roomId: string) {
  const clients = clientsByRoom.get(roomId);
  const roomService = roomServices.get(roomId);

  if (clients && clients.size === 0) {
    clientsByRoom.delete(roomId);
  }

  if (roomService?.isEmpty()) {
    roomServices.delete(roomId);
  }

  if (!roomServices.has(roomId)) {
    const ticker = roomTickers.get(roomId);

    if (ticker) {
      clearInterval(ticker);
      roomTickers.delete(roomId);
    }
  }
}

function broadcast(roomId: string, event: ServerEvent) {
  const payload = JSON.stringify(event);

  for (const client of getRoomClients(roomId)) {
    client.send(payload);
  }
}

export function handleWebSocketUpgrade(req: Request, server: Bun.Server<SocketData>) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId")?.trim().toUpperCase();
  const playerName = url.searchParams.get("playerName")?.trim() || "Player";
  const playerId = url.searchParams.get("playerId")?.trim();

  if (!roomId || !playerId) {
    return false;
  }

  return server.upgrade(req, {
    data: {
      clientId: `client-${Math.floor(Math.random() * 1_000_000)}`,
      playerId,
      playerName,
      roomId,
    },
  });
}

export const websocket = {
  open(ws: ServerWebSocket<SocketData>) {
    const { playerId, playerName, roomId } = ws.data;
    getRoomClients(roomId).add(ws);
    clearDisconnectCleanup(roomId, playerId);
    ensureRoomTicker(roomId);

    send(ws, {
      type: "connected",
      payload: { clientId: ws.data.clientId },
    });

    broadcast(roomId, {
      type: "state_sync",
      payload: getRoomService(roomId).connectPlayer(playerId, playerName),
    });
  },

  message(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
    const { playerId, roomId } = ws.data;
    const response = getRoomService(roomId).handleMessage(playerId, String(message));

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
    const { playerId, roomId } = ws.data;
    const roomClients = getRoomClients(roomId);
    roomClients.delete(ws);

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

const server = Bun.serve<SocketData>({
  port: 5555,
  fetch(req, server) {
    // Attempt to upgrade the connection to a WebSocket
    if (handleWebSocketUpgrade(req, server)) {
      return; // Upgrade handled
    }

    return new Response("Upgrade failed", { status: 400 });
  },
  websocket, // This links to the websocket object you already have
});

console.log(`Server started on http://localhost:${server.port}`);
