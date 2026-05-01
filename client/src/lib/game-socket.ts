import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  type ChatMessage,
  type GameSettings,
  type GameState,
  mockGameSettings,
  mockGameState,
  type Player,
} from "@/data/mock-game";

interface ChatMessageDto {
  author: string;
  id: string;
  isSystem: boolean;
  text: string;
  timestamp: string;
}

interface GameSnapshotDto {
  chatMessages: ChatMessageDto[];
  gameSettings: GameSettings;
  gameState: GameState;
  players: Player[];
}

type ServerEvent =
  | { type: "connected"; payload: { clientId: string } }
  | { type: "state_sync"; payload: GameSnapshotDto }
  | { type: "error"; payload: { message: string } };

type ClientEvent =
  | { type: "start_game" }
  | { type: "typing_word"; payload: { word: string } }
  | { type: "submit_word"; payload: { word: string } }
  | { type: "send_chat"; payload: { text: string } }
  | {
      type: "update_settings";
      payload: { startingLives: number; timePerTurn: number };
    };

interface GameConnectionState {
  chatMessages: ChatMessage[];
  clientId: string | null;
  connectionStatus: "connecting" | "connected" | "disconnected";
  gameSettings: GameSettings;
  gameState: GameState;
  playerId: string;
  players: Player[];
  sendChat: (text: string) => void;
  sendTypingWord: (word: string) => void;
  sendWord: (word: string) => void;
  startGame: () => void;
  updateSettings: (settings: {
    startingLives: number;
    timePerTurn: number;
  }) => void;
}

interface GameDataState {
  chatMessages: ChatMessage[];
  gameSettings: GameSettings;
  gameState: GameState;
  players: Player[];
}

const fallbackState: GameDataState = {
  players: [] as Player[],
  gameState: {
    ...mockGameState,
    round: 0,
    currentPlayerId: "",
    winnerId: null,
    status: "waiting",
  },
  chatMessages: [] as ChatMessage[],
  gameSettings: mockGameSettings,
};

function getSocketUrl({
  roomId,
  playerName,
  playerId,
  token,
}: {
  roomId: string;
  playerName: string;
  playerId: string;
  token: string | null;
}) {
  const query = new URLSearchParams({
    roomId,
    playerName,
    playerId,
  });

  if (token) {
    query.set("token", token);
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.DEV
    ? `${window.location.hostname}:5555`
    : window.location.host;
  return `${protocol}//${host}/ws?${query.toString()}`;
}

function hydrateSnapshot(snapshot: GameSnapshotDto) {
  return {
    players: snapshot.players,
    gameState: snapshot.gameState,
    chatMessages: snapshot.chatMessages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
    gameSettings: snapshot.gameSettings,
  };
}

export function useGameSocket(
  roomId: string,
  playerName: string,
  playerId: string,
  token: string | null
): GameConnectionState {
  const [gameData, setGameData] = useState(fallbackState);
  const [connectionStatus, setConnectionStatus] =
    useState<GameConnectionState["connectionStatus"]>("connecting");
  const [clientId, setClientId] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(
      getSocketUrl({ roomId, playerName, playerId, token })
    );
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      const parsed = JSON.parse(event.data) as ServerEvent;

      if (parsed.type === "connected") {
        setClientId(parsed.payload.clientId);
        return;
      }

      if (parsed.type === "state_sync") {
        setGameData(hydrateSnapshot(parsed.payload));
        return;
      }

      if (parsed.type === "error") {
        toast.error(parsed.payload.message);
        console.error(parsed.payload.message);
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [playerId, playerName, roomId, token]);

  function send(event: ClientEvent) {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(event));
  }

  return {
    ...gameData,
    connectionStatus,
    clientId,
    playerId,
    startGame() {
      send({ type: "start_game" });
    },
    sendTypingWord(word: string) {
      send({ type: "typing_word", payload: { word } });
    },
    sendWord(word: string) {
      send({ type: "submit_word", payload: { word } });
    },
    sendChat(text: string) {
      send({ type: "send_chat", payload: { text } });
    },
    updateSettings(settings) {
      send({ type: "update_settings", payload: settings });
    },
  };
}
