import {
  Check,
  Clock,
  Copy,
  Globe,
  Heart,
  Lock,
  Type,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameSettings } from "@/data/mock-game";

interface GameSettingsProps {
  settings: GameSettings;
}

export function GameSettingsPanel({ settings }: GameSettingsProps) {
  const [copied, setCopied] = useState(false);

  function copyRoomCode() {
    navigator.clipboard.writeText(settings.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const settingRows = [
    {
      icon: Users,
      label: "Max Players",
      value: settings.maxPlayers.toString(),
    },
    {
      icon: Clock,
      label: "Time per Turn",
      value: `${settings.timePerTurn}s`,
    },
    {
      icon: Heart,
      label: "Starting Lives",
      value: settings.startingLives.toString(),
    },
    {
      icon: Type,
      label: "Min Word Length",
      value: settings.minWordLength.toString(),
    },
    {
      icon: settings.isPublic ? Globe : Lock,
      label: "Visibility",
      value: settings.isPublic ? "Public" : "Private",
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card className="border-white/10 bg-zinc-800/50">
        <CardHeader className="px-3 pt-3 pb-2">
          <CardTitle className="font-medium text-white/50 text-xs uppercase tracking-wider">
            Room Code
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <Badge
              className="bg-zinc-700/80 px-3 py-1 font-mono text-lg text-white tracking-widest hover:bg-zinc-700"
              variant="secondary"
            >
              {settings.roomCode}
            </Badge>
            <Button
              className="h-8 w-8 text-white/50 hover:text-white"
              onClick={copyRoomCode}
              size="icon"
              variant="ghost"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-800/50">
        <CardHeader className="px-3 pt-3 pb-2">
          <CardTitle className="font-medium text-white/50 text-xs uppercase tracking-wider">
            Game Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex flex-col gap-2">
            {settingRows.map((row) => (
              <div
                className="flex items-center justify-between text-sm"
                key={row.label}
              >
                <div className="flex items-center gap-2 text-white/60">
                  <row.icon className="h-3.5 w-3.5" />
                  <span>{row.label}</span>
                </div>
                <span className="font-medium text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
