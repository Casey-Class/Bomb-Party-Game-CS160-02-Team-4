import {
  Bomb,
  MessageSquare,
  Play,
  RotateCcw,
  Settings,
  Users,
} from "lucide-react";
import { useParams } from "react-router";
import { BombPrompt } from "@/components/game/bomb-prompt";
import { GameChat } from "@/components/game/game-chat";
import { GameSettingsPanel } from "@/components/game/game-settings";
import { PlayerCircle } from "@/components/game/player-circle";
import { WordInput } from "@/components/game/word-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameSocket } from "@/lib/game-socket";
import { getStoredPlayerId, getStoredPlayerName } from "@/lib/player-identity";

function getActivePlayerAngle(playerCount: number, activePlayerIndex: number) {
  if (activePlayerIndex < 0 || playerCount === 0) {
    return 0;
  }
  return (2 * Math.PI * activePlayerIndex) / playerCount - Math.PI / 2;
}

export function GamePage() {
  const { roomId = "" } = useParams();
  const playerName = getStoredPlayerName();
  const localPlayerId = getStoredPlayerId();
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
  } = useGameSocket(roomId.toUpperCase(), playerName);
  const currentPlayer = players.find((p) => p.id === gameState.currentPlayerId);
  const localPlayer = players.find((p) => p.id === localPlayerId);
  const winner = players.find((p) => p.id === gameState.winnerId);
  const aliveCount = players.filter((p) => !p.isEliminated).length;
  const connectedCount = players.filter((p) => p.isConnected).length;
  const typedWord = localPlayer?.currentWord ?? "";
  const canStart = players.length >= 2 && gameState.status !== "playing";

  const activePlayerIndex = players.findIndex(
    (p) => p.id === gameState.currentPlayerId
  );
  const activePlayerAngle = getActivePlayerAngle(
    players.length,
    activePlayerIndex
  );
  const isLocalPlayersTurn =
    gameState.currentPlayerId === localPlayerId ||
    gameState.currentPlayerId === clientId;

  return (
    <div className="flex h-[calc(100svh-74px)] min-h-0 overflow-hidden bg-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-white/5 border-b bg-zinc-900/80 px-4 py-2">
          <div className="flex items-center gap-2">
            <Bomb className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-sm text-white">Bomb Party</span>
            <Badge
              className="bg-zinc-800 text-white/60 text-xs"
              variant="secondary"
            >
              Room: {gameSettings.roomCode}
            </Badge>
            <Badge
              className="border-emerald-400/30 text-emerald-300 text-xs capitalize"
              variant="outline"
            >
              {connectionStatus}
            </Badge>
            {gameState.status === "waiting" && (
              <Badge
                className="border-sky-400/30 text-sky-300 text-xs"
                variant="outline"
              >
                Lobby
              </Badge>
            )}
            {gameState.status === "ended" && winner && (
              <Badge
                className="border-emerald-400/30 text-emerald-300 text-xs"
                variant="outline"
              >
                Winner: {winner.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>
                {aliveCount}/{players.length} alive
              </span>
            </div>
            <div>{connectedCount} connected</div>
            <Badge
              className="border-amber-400/30 text-amber-400 text-xs"
              variant="outline"
            >
              Round {gameState.round}
            </Badge>
            <Button
              className="h-7 gap-1 bg-zinc-800 text-white hover:bg-zinc-700"
              disabled={!canStart}
              onClick={startGame}
              size="sm"
              variant="secondary"
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

        <div className="relative min-h-0 flex-1">
          <PlayerCircle
            currentSyllable={gameState.currentSyllable}
            players={players}
          />
          <BombPrompt
            activePlayerAngle={activePlayerAngle}
            gameState={gameState}
          />
        </div>

        <div className="border-white/5 border-t bg-zinc-900/80 px-6 py-4">
          <WordInput
            currentPlayer={currentPlayer}
            gameState={gameState}
            isLocalPlayer={isLocalPlayersTurn}
            onSubmitWord={sendWord}
            onTypedWordChange={sendTypingWord}
            typedWord={typedWord}
          />
        </div>
      </div>

      <div className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-white/5 border-l bg-zinc-900/50">
        <Tabs className="flex h-full min-h-0 flex-col overflow-hidden" defaultValue="chat">
          <TabsList className="h-10 w-full shrink-0 rounded-none border-white/5 border-b bg-transparent px-2">
            <TabsTrigger
              className="flex-1 gap-1.5 rounded-md text-white/50 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              value="chat"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              className="flex-1 gap-1.5 rounded-md text-white/50 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              value="settings"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent className="m-0 min-h-0 flex-1 overflow-hidden" value="chat">
            <GameChat messages={chatMessages} onSendMessage={sendChat} />
          </TabsContent>
          <TabsContent className="m-0 min-h-0 flex-1 overflow-auto" value="settings">
            <GameSettingsPanel settings={gameSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
