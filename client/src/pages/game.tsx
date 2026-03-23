import { useState } from "react"
import {
  mockPlayers,
  mockGameState,
  mockChatMessages,
  mockGameSettings,
} from "@/data/mock-game"
import { PlayerCircle } from "@/components/game/player-circle"
import { BombPrompt } from "@/components/game/bomb-prompt"
import { WordInput } from "@/components/game/word-input"
import { GameSettingsPanel } from "@/components/game/game-settings"
import { GameChat } from "@/components/game/game-chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bomb, MessageSquare, Settings, Users } from "lucide-react"

export function GamePage() {
  const [typedWord, setTypedWord] = useState("")
  const currentPlayer = mockPlayers.find(
    (p) => p.id === mockGameState.currentPlayerId,
  )
  const aliveCount = mockPlayers.filter((p) => !p.isEliminated).length

  const activePlayerIndex = mockPlayers.findIndex(
    (p) => p.id === mockGameState.currentPlayerId,
  )
  const activePlayerAngle =
    activePlayerIndex >= 0
      ? (2 * Math.PI * activePlayerIndex) / mockPlayers.length - Math.PI / 2
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
              Room: {mockGameSettings.roomCode}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {aliveCount}/{mockPlayers.length} alive
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-amber-400/30 text-amber-400 text-xs"
            >
              Round {mockGameState.round}
            </Badge>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          <PlayerCircle
            players={mockPlayers}
            currentSyllable={mockGameState.currentSyllable}
            activePlayerTypedWord={typedWord}
          />
          <BombPrompt gameState={mockGameState} activePlayerAngle={activePlayerAngle} />
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/80">
          <WordInput
            currentPlayer={currentPlayer}
            gameState={mockGameState}
            typedWord={typedWord}
            onTypedWordChange={setTypedWord}
            isLocalPlayer={mockGameState.currentPlayerId === "p5"}
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
            <GameChat messages={mockChatMessages} />
          </TabsContent>
          <TabsContent value="settings" className="flex-1 m-0 overflow-auto">
            <GameSettingsPanel settings={mockGameSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
