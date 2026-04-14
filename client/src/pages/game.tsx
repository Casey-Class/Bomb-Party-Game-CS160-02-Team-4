import { PlayerCircle } from "@/components/game/player-circle"
import { BombPrompt } from "@/components/game/bomb-prompt"
import { WordInput } from "@/components/game/word-input"
import { GameSettingsPanel } from "@/components/game/game-settings"
import { GameChat } from "@/components/game/game-chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bomb, MessageSquare, Play, RotateCcw, Settings, Users } from "lucide-react"
import { useGameSocket } from "@/lib/game-socket"
import { getStoredPlayerId, getStoredPlayerName } from "@/lib/player-identity"
import { useParams } from "react-router"

function getActivePlayerAngle(playerCount: number, activePlayerIndex: number) {
  if (activePlayerIndex < 0 || playerCount === 0) return 0
  return (2 * Math.PI * activePlayerIndex) / playerCount - Math.PI / 2
}

export function GamePage() {
  const { roomId = "" } = useParams()
  const playerName = getStoredPlayerName()
  const localPlayerId = getStoredPlayerId()
  const {
    players,
    gameState,
    chatMessages,
    gameSettings,
    connectionStatus,
    clientId,
    startGame,
    sendTypingWord,
    sendWord,
    sendChat,
  } = useGameSocket(roomId.toUpperCase(), playerName)
  const currentPlayer = players.find((p) => p.id === gameState.currentPlayerId)
  const localPlayer = players.find((p) => p.id === localPlayerId)
  const winner = players.find((p) => p.id === gameState.winnerId)
  const aliveCount = players.filter((p) => !p.isEliminated).length
  const connectedCount = players.filter((p) => p.isConnected).length
  const typedWord = localPlayer?.currentWord ?? ""
  const canStart = players.length >= 2 && gameState.status !== "playing"

  const activePlayerIndex = players.findIndex((p) => p.id === gameState.currentPlayerId)
  const activePlayerAngle = getActivePlayerAngle(players.length, activePlayerIndex)
  const isLocalPlayersTurn =
    gameState.currentPlayerId === localPlayerId || gameState.currentPlayerId === clientId

  return (
    <div className="flex h-svh w-full bg-zinc-900 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Bomb className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-white text-sm">Bomb Party</span>
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-white/60 text-xs"
            >
              Room: {gameSettings.roomCode}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-400/30 text-emerald-300 text-xs capitalize"
            >
              {connectionStatus}
            </Badge>
            {gameState.status === "waiting" && (
              <Badge
                variant="outline"
                className="border-sky-400/30 text-sky-300 text-xs"
              >
                Lobby
              </Badge>
            )}
            {gameState.status === "ended" && winner && (
              <Badge
                variant="outline"
                className="border-emerald-400/30 text-emerald-300 text-xs"
              >
                Winner: {winner.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {aliveCount}/{players.length} alive
              </span>
            </div>
            <div>{connectedCount} connected</div>
            <Badge
              variant="outline"
              className="border-amber-400/30 text-amber-400 text-xs"
            >
              Round {gameState.round}
            </Badge>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 gap-1 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={startGame}
              disabled={!canStart}
            >
              {gameState.status === "ended" ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {gameState.status === "ended" ? "Restart" : "Start"}
            </Button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          <PlayerCircle players={players} currentSyllable={gameState.currentSyllable} />
          <BombPrompt gameState={gameState} activePlayerAngle={activePlayerAngle} />
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/80">
          <WordInput
            currentPlayer={currentPlayer}
            gameState={gameState}
            typedWord={typedWord}
            onTypedWordChange={sendTypingWord}
            onSubmitWord={sendWord}
            isLocalPlayer={isLocalPlayersTurn}
          />
        </div>
      </div>

      <div className="w-80 border-l border-white/5 bg-zinc-900/50 flex flex-col shrink-0">
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          <TabsList className="w-full rounded-none border-b border-white/5 bg-transparent h-10 px-2 shrink-0">
            <TabsTrigger
              value="chat"
              className="flex-1 gap-1.5 text-xs text-white/50 data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 gap-1.5 text-xs text-white/50 data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 m-0 min-h-0">
            <GameChat messages={chatMessages} onSendMessage={sendChat} />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 m-0 overflow-auto">
            <GameSettingsPanel settings={gameSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
