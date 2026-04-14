import { type Player } from "@/data/mock-game"
import { Heart, Skull } from "lucide-react"

interface PlayerNodeProps {
  player: Player
  style: React.CSSProperties
  currentSyllable: string
}

function highlightSyllable(
  word: string | null,
  syllable: string,
): React.ReactNode {
  if (!word) return null
  const lowerWord = word.toLowerCase()
  const lowerSyllable = syllable.toLowerCase()
  const idx = lowerWord.indexOf(lowerSyllable)

  if (idx === -1) {
    return <span className="text-white">{word}</span>
  }

  return (
    <span>
      <span className="text-white">{word.slice(0, idx)}</span>
      <span className="text-emerald-400 font-bold">
        {word.slice(idx, idx + syllable.length)}
      </span>
      <span className="text-white">
        {word.slice(idx + syllable.length)}
      </span>
    </span>
  )
}

function PlayerNode({ player, style, currentSyllable }: PlayerNodeProps) {
  const isEliminated = player.isEliminated
  const isActive = player.isActive
  const isDisconnected = !player.isConnected
  const displayedWord = player.currentWord

  return (
    <div
      className="absolute flex flex-col items-center gap-1 transition-all duration-500"
      style={{
        ...style,
        transform: `${style.transform ?? ""} translate(-50%, -50%)`,
      }}
    >
      <span
        className={`text-xs font-semibold truncate max-w-30 ${
          isEliminated
            ? "text-muted-foreground/50 italic line-through"
            : isDisconnected
              ? "text-white/40"
            : isActive
              ? "text-amber-300"
              : "text-white/90"
        }`}
      >
        {player.name}
      </span>

      <div className="flex gap-0.5">
        {Array.from({ length: player.maxLives }).map((_, i) => (
          <Heart
            key={i}
            className={`h-3 w-3 ${
              i < player.lives
                ? "text-red-500 fill-red-500"
                : "text-red-900/40 fill-red-900/40"
            }`}
          />
        ))}
      </div>

      <div
        className={`relative w-14 h-14 rounded-sm overflow-hidden border-2 transition-all duration-300 ${
          isEliminated
            ? "border-muted-foreground/30 grayscale opacity-50"
            : isDisconnected
              ? "border-white/10 opacity-60"
            : isActive
              ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              : "border-white/20"
        }`}
      >
        <div
          className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
          style={{
            backgroundColor: isEliminated
              ? "#555"
              : player.avatarColor,
          }}
        >
          {isEliminated ? (
            <Skull className="h-6 w-6 text-white/60" />
          ) : (
            player.name.slice(0, 2).toUpperCase()
          )}
        </div>

        {isActive && (
          <div className="absolute inset-0 rounded-sm animate-pulse bg-amber-400/10" />
        )}
      </div>

      {displayedWord && (
        <span className="text-xs font-mono tracking-wider">
          {highlightSyllable(displayedWord, currentSyllable)}
        </span>
      )}

      {!isEliminated && isDisconnected && (
        <span className="text-[10px] uppercase tracking-wide text-white/35">
          Reconnecting
        </span>
      )}
    </div>
  )
}

interface PlayerCircleProps {
  players: Player[]
  currentSyllable: string
}

export function PlayerCircle({ players, currentSyllable }: PlayerCircleProps) {
  const centerX = 50
  const centerY = 50
  const radiusX = 38
  const radiusY = 40

  return (
    <div className="relative w-full h-full">
      {players.map((player, index) => {
        const angle =
          (2 * Math.PI * index) / players.length - Math.PI / 2
        const x = centerX + radiusX * Math.cos(angle)
        const y = centerY + radiusY * Math.sin(angle)

        return (
          <PlayerNode
            key={player.id}
            player={player}
            currentSyllable={currentSyllable}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          />
        )
      })}
    </div>
  )
}
