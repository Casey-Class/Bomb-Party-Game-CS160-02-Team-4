interface TimerRingProps {
  circumference: number;
  dashOffset: number;
  isUrgent: boolean;
  timerRadius: number;
}

export function TimerRing({
  timerRadius,
  circumference,
  dashOffset,
  isUrgent,
}: TimerRingProps) {
  return (
    <svg
      aria-hidden="true"
      className="absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]"
      focusable="false"
      viewBox="0 0 132 132"
    >
      <circle
        cx="66"
        cy="66"
        fill="none"
        r={timerRadius}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        className={`origin-center -rotate-90 transition-all duration-1000 ease-linear ${
          isUrgent ? "animate-pulse" : ""
        }`}
        cx="66"
        cy="66"
        fill="none"
        r={timerRadius}
        stroke={isUrgent ? "#ef4444" : "rgba(251, 191, 36, 0.7)"}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth="4"
        style={{ transformOrigin: "66px 66px" }}
      />
    </svg>
  );
}

interface BombFuseProps {
  isUrgent: boolean;
}

export function BombFuse({ isUrgent }: BombFuseProps) {
  return (
    <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 flex-col items-center">
      <div
        className={`text-2xl ${isUrgent ? "animate-bounce" : "animate-pulse"}`}
      >
        ✦
      </div>
      <div className="h-3 w-0.5 rounded-full bg-linear-to-b from-amber-400 to-amber-800" />
    </div>
  );
}

interface DirectionArrowProps {
  angleToActivePlayer: number;
}

const ARROW_INNER_RADIUS = 78;
const ARROW_OUTER_RADIUS = 130;

export function DirectionArrow({ angleToActivePlayer }: DirectionArrowProps) {
  const startX = Math.cos(angleToActivePlayer) * ARROW_INNER_RADIUS;
  const startY = Math.sin(angleToActivePlayer) * ARROW_INNER_RADIUS;
  const endX = Math.cos(angleToActivePlayer) * ARROW_OUTER_RADIUS;
  const endY = Math.sin(angleToActivePlayer) * ARROW_OUTER_RADIUS;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      focusable="false"
      height="300"
      viewBox="-150 -150 300 300"
      width="300"
    >
      <defs>
        <marker
          id="direction-arrowhead"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          markerWidth="16"
          orient="auto"
          refX="14"
          refY="6"
        >
          <polygon fill="#fbbf24" points="0 0, 16 6, 0 12" />
        </marker>
      </defs>
      <line
        markerEnd="url(#direction-arrowhead)"
        stroke="#fbbf24"
        strokeLinecap="round"
        strokeWidth="6"
        style={{
          filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))",
        }}
        x1={startX}
        x2={endX}
        y1={startY}
        y2={endY}
      />
    </svg>
  );
}
