import { type GameState } from "@/data/mock-game"
import { TimerRing, BombFuse, DirectionArrow } from "./bomb-icons"

interface BombPromptProps {
  gameState: GameState
  activePlayerAngle: number
}

export function BombPrompt({ gameState, activePlayerAngle }: BombPromptProps) {
  const { currentSyllable, timeLeft, maxTime } = gameState
  const timeRemainingPercent = (timeLeft / maxTime) * 100
  const isUrgent = timeLeft <= 5

  const timerRadius = 58
  const timerCircumference = 2 * Math.PI * timerRadius
  const timerDashOffset =
    timerCircumference - (timeRemainingPercent / 100) * timerCircumference

  const syllableColor = isUrgent ? "text-red-400 animate-pulse" : "text-white"
  const bombGlow = isUrgent
    ? "bg-linear-to-br from-zinc-700 to-zinc-900 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
    : "bg-linear-to-br from-zinc-600 to-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.5)]"

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
      <div className="relative">
        <TimerRing
          timerRadius={timerRadius}
          circumference={timerCircumference}
          dashOffset={timerDashOffset}
          isUrgent={isUrgent}
        />

        <BombFuse isUrgent={isUrgent} />

        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${bombGlow}`}
          style={{ border: "3px solid rgba(255,255,255,0.15)" }}
        >
          <div className="w-20 h-20 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center">
            <span className={`text-2xl font-black tracking-wider ${syllableColor}`}>
              {currentSyllable}
            </span>
          </div>
        </div>

        <DirectionArrow angleToActivePlayer={activePlayerAngle} />
      </div>
    </div>
  )
}
