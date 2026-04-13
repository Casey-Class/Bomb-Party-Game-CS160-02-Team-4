import type { ServerWebSocket } from "bun";
import { WebSocketGameService } from "./service";
import type { ServerEvent, SocketData } from "./types";

const clientsByRoom = new Map<string, Set<ServerWebSocket<SocketData>>>();
const roomServices = new Map<string, WebSocketGameService>();

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

function cleanupRoom(roomId: string) {
  const clients = clientsByRoom.get(roomId);
  const roomService = roomServices.get(roomId);

  if (clients && clients.size === 0) {
    clientsByRoom.delete(roomId);
  }

  if (roomService?.isEmpty()) {
    roomServices.delete(roomId);
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

  if (!roomId) {
    return false;
  }

  return server.upgrade(req, {
    data: {
      clientId: `client-${Math.floor(Math.random() * 1_000_000)}`,
      playerName,
      roomId,
    },
  });
}

export const websocket = {
  open(ws: ServerWebSocket<SocketData>) {
    getRoomClients(ws.data.roomId).add(ws);

    send(ws, {
      type: "connected",
      payload: { clientId: ws.data.clientId },
    });

    broadcast(ws.data.roomId, {
      type: "state_sync",
      payload: getRoomService(ws.data.roomId).connectPlayer(
        ws.data.clientId,
        ws.data.playerName,
      ),
    });
  },

  message(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
    const response = getRoomService(ws.data.roomId).handleMessage(
      ws.data.clientId,
      String(message),
    );

    if (!response) {
      return;
    }

    if (response.type === "state_sync") {
      broadcast(ws.data.roomId, response);
      return;
    }

    send(ws, response);
  },

  close(ws: ServerWebSocket<SocketData>) {
    const roomClients = getRoomClients(ws.data.roomId);
    roomClients.delete(ws);

    broadcast(ws.data.roomId, {
      type: "state_sync",
      payload: getRoomService(ws.data.roomId).disconnectPlayer(ws.data.clientId),
    });

    cleanupRoom(ws.data.roomId);
  },
};
