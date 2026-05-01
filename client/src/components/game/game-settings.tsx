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
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GameSettings } from "@/data/mock-game";

interface GameSettingsProps {
  canEdit: boolean;
  isHost: boolean;
  onUpdateSettings: (settings: {
    startingLives: number;
    timePerTurn: number;
  }) => void;
  settings: GameSettings;
}

const TURN_TIME_OPTIONS = [10, 15, 20, 30, 45, 60];
const STARTING_LIVES_OPTIONS = [1, 2, 3, 4, 5];

export function GameSettingsPanel({
  canEdit,
  isHost,
  onUpdateSettings,
  settings,
}: GameSettingsProps) {
  const [copied, setCopied] = useState(false);
  let settingsMessage = "Only the room host can change these settings.";

  if (canEdit) {
    settingsMessage =
      "You can change these while the room is still in the lobby.";
  } else if (isHost) {
    settingsMessage = "Settings lock as soon as the game starts.";
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(settings.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTimePerTurnChange(value: string) {
    onUpdateSettings({
      timePerTurn: Number(value),
      startingLives: settings.startingLives,
    });
  }

  function handleStartingLivesChange(value: string) {
    onUpdateSettings({
      timePerTurn: settings.timePerTurn,
      startingLives: Number(value),
    });
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
          <div className="mb-3 rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-2 text-white/55 text-xs">
            {settingsMessage}
          </div>
          <FieldGroup className="mb-4 grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel
                className="text-white/65 text-xs"
                htmlFor="turn-time-select"
              >
                Time per Turn
              </FieldLabel>
              <FieldContent>
                <Select
                  disabled={!canEdit}
                  onValueChange={handleTimePerTurnChange}
                  value={settings.timePerTurn.toString()}
                >
                  <SelectTrigger className="w-full" id="turn-time-select">
                    <SelectValue placeholder="Time per turn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TURN_TIME_OPTIONS.map((seconds) => (
                        <SelectItem key={seconds} value={seconds.toString()}>
                          {seconds}s
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel
                className="text-white/65 text-xs"
                htmlFor="starting-lives-select"
              >
                Starting Lives
              </FieldLabel>
              <FieldContent>
                <Select
                  disabled={!canEdit}
                  onValueChange={handleStartingLivesChange}
                  value={settings.startingLives.toString()}
                >
                  <SelectTrigger className="w-full" id="starting-lives-select">
                    <SelectValue placeholder="Starting lives" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STARTING_LIVES_OPTIONS.map((lives) => (
                        <SelectItem key={lives} value={lives.toString()}>
                          {lives}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </FieldGroup>
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
