import { type GameSettings } from "@/data/mock-game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Globe,
  Heart,
  Clock,
  Users,
  Type,
  Lock,
  Check,
} from "lucide-react"
import { useState } from "react"

interface GameSettingsProps {
  settings: GameSettings
}

export function GameSettingsPanel({ settings }: GameSettingsProps) {
  const [copied, setCopied] = useState(false)

  function copyRoomCode() {
    navigator.clipboard.writeText(settings.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card className="bg-zinc-800/50 border-white/10">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Room Code
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 px-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-lg font-mono tracking-widest px-3 py-1 bg-zinc-700/80 text-white hover:bg-zinc-700"
            >
              {settings.roomCode}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/50 hover:text-white"
              onClick={copyRoomCode}
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

      <Card className="bg-zinc-800/50 border-white/10">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Game Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 px-3">
          <div className="flex flex-col gap-2">
            {settingRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <row.icon className="h-3.5 w-3.5" />
                  <span>{row.label}</span>
                </div>
                <span className="text-white font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
