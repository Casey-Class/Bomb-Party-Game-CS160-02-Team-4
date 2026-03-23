interface TimerRingProps {
  timerRadius: number
  circumference: number
  dashOffset: number
  isUrgent: boolean
}

export function TimerRing({
  timerRadius,
  circumference,
  dashOffset,
  isUrgent,
}: TimerRingProps) {
  return (
    <svg
      className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]"
      viewBox="0 0 132 132"
    >
      <circle
        cx="66"
        cy="66"
        r={timerRadius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx="66"
        cy="66"
        r={timerRadius}
        fill="none"
        stroke={isUrgent ? "#ef4444" : "rgba(251, 191, 36, 0.7)"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={`transition-all duration-1000 ease-linear origin-center -rotate-90 ${
          isUrgent ? "animate-pulse" : ""
        }`}
        style={{ transformOrigin: "66px 66px" }}
      />
    </svg>
  )
}

interface BombFuseProps {
  isUrgent: boolean
}

export function BombFuse({ isUrgent }: BombFuseProps) {
  return (
    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div
        className={`text-2xl ${isUrgent ? "animate-bounce" : "animate-pulse"}`}
      >
        ✦
      </div>
      <div className="w-0.5 h-3 bg-linear-to-b from-amber-400 to-amber-800 rounded-full" />
    </div>
  )
}

interface DirectionArrowProps {
  angleToActivePlayer: number
}

const ARROW_INNER_RADIUS = 78
const ARROW_OUTER_RADIUS = 130

export function DirectionArrow({ angleToActivePlayer }: DirectionArrowProps) {
  const startX = Math.cos(angleToActivePlayer) * ARROW_INNER_RADIUS
  const startY = Math.sin(angleToActivePlayer) * ARROW_INNER_RADIUS
  const endX = Math.cos(angleToActivePlayer) * ARROW_OUTER_RADIUS
  const endY = Math.sin(angleToActivePlayer) * ARROW_OUTER_RADIUS

  return (
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      width="300"
      height="300"
      viewBox="-150 -150 300 300"
    >
      <defs>
        <marker
          id="direction-arrowhead"
          markerWidth="16"
          markerHeight="12"
          refX="14"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 16 6, 0 12" fill="#fbbf24" />
        </marker>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#fbbf24"
        strokeWidth="6"
        strokeLinecap="round"
        markerEnd="url(#direction-arrowhead)"
        style={{
          filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))",
        }}
      />
    </svg>
  )
}
