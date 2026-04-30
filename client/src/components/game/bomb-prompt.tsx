import type { GameState } from "@/data/mock-game";
import { BombFuse, DirectionArrow, TimerRing } from "./bomb-icons";

interface BombPromptProps {
  activePlayerAngle: number;
  gameState: GameState;
}

export function BombPrompt({ gameState, activePlayerAngle }: BombPromptProps) {
  const { currentSyllable, timeLeft, maxTime } = gameState;
  const normalizedMaxTime = Math.max(maxTime, 1);
  const timeRemainingPercent = (timeLeft / normalizedMaxTime) * 100;
  const isUrgent = gameState.status === "playing" && timeLeft <= 5;
  const shouldShowDirectionArrow =
    gameState.status === "playing" && gameState.currentPlayerId !== "";
  let syllableLabel = currentSyllable;

  if (gameState.status === "waiting") {
    syllableLabel = "WAIT";
  } else if (gameState.status === "ended") {
    syllableLabel = "DONE";
  }

  const timerRadius = 58;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerDashOffset =
    timerCircumference - (timeRemainingPercent / 100) * timerCircumference;

  const syllableColor = isUrgent ? "text-red-400 animate-pulse" : "text-white";
  const bombGlow = isUrgent
    ? "bg-linear-to-br from-zinc-700 to-zinc-900 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
    : "bg-linear-to-br from-zinc-600 to-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.5)]";

  return (
    <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
      <div className="relative">
        <TimerRing
          circumference={timerCircumference}
          dashOffset={timerDashOffset}
          isUrgent={isUrgent}
          timerRadius={timerRadius}
        />

        <BombFuse isUrgent={isUrgent} />

        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300 ${bombGlow}`}
          style={{ border: "3px solid rgba(255,255,255,0.15)" }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-zinc-800/80">
            <span
              className={`font-black text-2xl tracking-wider ${syllableColor}`}
            >
              {syllableLabel}
            </span>
          </div>
        </div>

        {shouldShowDirectionArrow && (
          <DirectionArrow angleToActivePlayer={activePlayerAngle} />
        )}
      </div>
    </div>
  );
}
