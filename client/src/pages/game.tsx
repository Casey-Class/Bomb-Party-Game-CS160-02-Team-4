import { useState } from "react"
import { PlayerCircle } from "@/components/game/player-circle"
import { BombPrompt } from "@/components/game/bomb-prompt"
import { WordInput } from "@/components/game/word-input"
import { GameSettingsPanel } from "@/components/game/game-settings"
import { GameChat } from "@/components/game/game-chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bomb, MessageSquare, Settings, Users } from "lucide-react"
import { useGameSocket } from "@/lib/game-socket"

export function GamePage() {
  const [typedWord, setTypedWord] = useState("")
  const {
    players,
    gameState,
    chatMessages,
    gameSettings,
    connectionStatus,
    clientId,
    sendTypingWord,
    sendWord,
    sendChat,
  } = useGameSocket()
  const currentPlayer = players.find((p) => p.id === gameState.currentPlayerId)
  const aliveCount = players.filter((p) => !p.isEliminated).length

  const activePlayerIndex = players.findIndex((p) => p.id === gameState.currentPlayerId)
  const activePlayerAngle =
    activePlayerIndex >= 0 && players.length > 0
      ? (2 * Math.PI * activePlayerIndex) / players.length - Math.PI / 2
      : 0

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
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {aliveCount}/{players.length} alive
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-amber-400/30 text-amber-400 text-xs"
            >
              Round {gameState.round}
            </Badge>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          <PlayerCircle
            players={players}
            currentSyllable={gameState.currentSyllable}
            activePlayerTypedWord={typedWord}
          />
          <BombPrompt gameState={gameState} activePlayerAngle={activePlayerAngle} />
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/80">
          <WordInput
            currentPlayer={currentPlayer}
            gameState={gameState}
            typedWord={typedWord}
            onTypedWordChange={(word) => {
              setTypedWord(word)
              sendTypingWord(word)
            }}
            onSubmitWord={sendWord}
            isLocalPlayer={gameState.currentPlayerId === clientId}
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
