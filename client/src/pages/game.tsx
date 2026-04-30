import {
  Check,
  Copy,
  MessageSquare,
  Play,
  RotateCcw,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { BombPrompt } from "@/components/game/bomb-prompt";
import { GameChat } from "@/components/game/game-chat";
import { GameSettingsPanel } from "@/components/game/game-settings";
import { PlayerCircle } from "@/components/game/player-circle";
import { WordInput } from "@/components/game/word-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGameSocket } from "@/lib/game-socket";
import { getStoredPlayerId, getStoredPlayerName } from "@/lib/player-identity";

function getActivePlayerAngle(playerCount: number, activePlayerIndex: number) {
  if (activePlayerIndex < 0 || playerCount === 0) {
    return 0;
  }
  return (2 * Math.PI * activePlayerIndex) / playerCount - Math.PI / 2;
}

function getConnectionStatusColor(connectionStatus: string) {
  switch (connectionStatus) {
    case "connected":
      return "bg-emerald-400";
    case "connecting":
      return "bg-amber-400";
    default:
      return "bg-red-400";
  }
}

export function GamePage() {
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
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
  const connectionStatusColor = getConnectionStatusColor(connectionStatus);
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

  function copyRoomCode() {
    navigator.clipboard.writeText(gameSettings.roomCode);
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  }

  return (
    <div className="flex h-[calc(100svh-74px)] min-h-0 overflow-hidden bg-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-white/5 border-b bg-zinc-900/80 px-4 py-2">
          <div className="flex items-center gap-2">
            <span
              aria-label={connectionStatus}
              className={`h-2.5 w-2.5 rounded-full ${connectionStatusColor}`}
              title={connectionStatus}
            />
            <Badge
              className="gap-1 bg-zinc-800 pr-1 text-white/60 text-xs"
              variant="secondary"
            >
              <span>Room: {gameSettings.roomCode}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Copy room code"
                    className="h-4 w-4 rounded-full p-0 text-white/50 hover:bg-white/10 hover:text-white"
                    onClick={copyRoomCode}
                    size="icon"
                    variant="ghost"
                  >
                    {copiedRoomCode ? (
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-2.5 w-2.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy room code</TooltipContent>
              </Tooltip>
            </Badge>
            {gameState.status === "waiting" && (
              <Badge
                className="border-sky-400/30 text-sky-300 text-xs"
                variant="outline"
              >
                Lobby
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-white/50 text-xs">
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
          <div className="pointer-events-none absolute top-4 left-4 z-10">
            <Badge
              className="border-amber-400/30 bg-zinc-900/80 text-amber-400 text-xs shadow-lg backdrop-blur-sm"
              variant="outline"
            >
              Round {gameState.round}
            </Badge>
          </div>
          <div className="pointer-events-none absolute top-4 right-4 z-10">
            <Badge
              className="gap-1 border-white/10 bg-zinc-900/80 text-white/80 text-xs shadow-lg backdrop-blur-sm"
              variant="outline"
            >
              <Users className="h-3.5 w-3.5" />
              <span>
                {aliveCount}/{players.length} alive
              </span>
            </Badge>
          </div>
          <PlayerCircle
            currentSyllable={gameState.currentSyllable}
            players={players}
          />
          <BombPrompt
            activePlayerAngle={activePlayerAngle}
            gameState={gameState}
          />
          {gameState.status === "ended" && winner && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="min-w-64 rounded-2xl border border-amber-400/25 bg-zinc-900/90 px-8 py-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="text-white/50 text-xs uppercase tracking-[0.24em]">
                  Winner
                </div>
                <div className="mt-2 font-black text-3xl text-white">
                  {winner.name}
                </div>
              </div>
            </div>
          )}
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
