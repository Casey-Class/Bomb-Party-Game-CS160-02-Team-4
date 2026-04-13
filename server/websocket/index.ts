import type { ServerWebSocket } from "bun";
import { webSocketGameService } from "./service";
import type { ServerEvent, SocketData } from "./types";

const clients = new Set<ServerWebSocket<SocketData>>();

function send(ws: ServerWebSocket<SocketData>, event: ServerEvent) {
  ws.send(JSON.stringify(event));
}

function broadcast(event: ServerEvent) {
  const payload = JSON.stringify(event);

  for (const client of clients) {
    client.send(payload);
  }
}

export function handleWebSocketUpgrade(req: Request, server: Bun.Server<SocketData>) {
  return server.upgrade(req, {
    data: {
      clientId: `client-${Math.floor(Math.random() * 1_000_000)}`,
    },
  });
}

export const websocket = {
  open(ws: ServerWebSocket<SocketData>) {
    clients.add(ws);

    send(ws, {
      type: "connected",
      payload: { clientId: ws.data.clientId },
    });

    broadcast({
      type: "state_sync",
      payload: webSocketGameService.connectPlayer(ws.data.clientId),
    });
  },

  message(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
    const response = webSocketGameService.handleMessage(ws.data.clientId, String(message));

    if (!response) {
      return;
    }

    if (response.type === "state_sync") {
      broadcast(response);
      return;
    }

    send(ws, response);
  },

  close(ws: ServerWebSocket<SocketData>) {
    clients.delete(ws);

    broadcast({
      type: "state_sync",
      payload: webSocketGameService.disconnectPlayer(ws.data.clientId),
    });
  },
};
