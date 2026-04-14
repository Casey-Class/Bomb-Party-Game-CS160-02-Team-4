import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import {
  mockGameSettings,
  mockGameState,
  type ChatMessage,
  type GameSettings,
  type GameState,
  type Player,
} from "@/data/mock-game"
import { getStoredPlayerId } from "@/lib/player-identity"

interface ChatMessageDto {
  id: string
  author: string
  text: string
  timestamp: string
  isSystem: boolean
}

interface GameSnapshotDto {
  players: Player[]
  gameState: GameState
  chatMessages: ChatMessageDto[]
  gameSettings: GameSettings
}

type ServerEvent =
  | { type: "connected"; payload: { clientId: string } }
  | { type: "state_sync"; payload: GameSnapshotDto }
  | { type: "error"; payload: { message: string } }

type ClientEvent =
  | { type: "start_game" }
  | { type: "typing_word"; payload: { word: string } }
  | { type: "submit_word"; payload: { word: string } }
  | { type: "send_chat"; payload: { text: string } }

interface GameConnectionState {
  players: Player[]
  gameState: GameState
  chatMessages: ChatMessage[]
  gameSettings: GameSettings
  connectionStatus: "connecting" | "connected" | "disconnected"
  clientId: string | null
  playerId: string
  startGame: () => void
  sendTypingWord: (word: string) => void
  sendWord: (word: string) => void
  sendChat: (text: string) => void
}

interface GameDataState {
  players: Player[]
  gameState: GameState
  chatMessages: ChatMessage[]
  gameSettings: GameSettings
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
}

function getSocketUrl(roomId: string, playerName: string, playerId: string) {
  const query = new URLSearchParams({
    roomId,
    playerName,
    playerId,
  });
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = import.meta.env.DEV ? "localhost:5555" : window.location.host
  return `${protocol}//${host}/ws?${query.toString()}`
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
  }
}

export function useGameSocket(roomId: string, playerName: string): GameConnectionState {
  const [gameData, setGameData] = useState(fallbackState)
  const [connectionStatus, setConnectionStatus] =
    useState<GameConnectionState["connectionStatus"]>("connecting")
  const [clientId, setClientId] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const playerIdRef = useRef(getStoredPlayerId())

  useEffect(() => {
    const socket = new WebSocket(getSocketUrl(roomId, playerName, playerIdRef.current))
    socketRef.current = socket

    socket.addEventListener("open", () => {
      setConnectionStatus("connected")
    })

    socket.addEventListener("message", (event) => {
      const parsed = JSON.parse(event.data) as ServerEvent

      if (parsed.type === "connected") {
        setClientId(parsed.payload.clientId)
        return
      }

      if (parsed.type === "state_sync") {
        setGameData(hydrateSnapshot(parsed.payload))
        return
      }

      if (parsed.type === "error") {
        toast.error(parsed.payload.message)
        console.error(parsed.payload.message)
      }
    })

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected")
    })

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected")
    })

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [playerName, roomId])

  function send(event: ClientEvent) {
    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    socket.send(JSON.stringify(event))
  }

  return {
    ...gameData,
    connectionStatus,
    clientId,
    playerId: playerIdRef.current,
    startGame() {
      send({ type: "start_game" })
    },
    sendTypingWord(word: string) {
      send({ type: "typing_word", payload: { word } })
    },
    sendWord(word: string) {
      send({ type: "submit_word", payload: { word } })
    },
    sendChat(text: string) {
      send({ type: "send_chat", payload: { text } })
    },
  }
}
