import { Heart, Skull } from "lucide-react";
import type { Player } from "@/data/mock-game";

interface PlayerNodeProps {
  currentSyllable: string;
  player: Player;
  style: React.CSSProperties;
}

function highlightSyllable(
  word: string | null,
  syllable: string
): React.ReactNode {
  if (!word) {
    return null;
  }
  const lowerWord = word.toLowerCase();
  const lowerSyllable = syllable.toLowerCase();
  const idx = lowerWord.indexOf(lowerSyllable);

  if (idx === -1) {
    return <span className="text-white">{word}</span>;
  }

  return (
    <span>
      <span className="text-white">{word.slice(0, idx)}</span>
      <span className="font-bold text-emerald-400">
        {word.slice(idx, idx + syllable.length)}
      </span>
      <span className="text-white">{word.slice(idx + syllable.length)}</span>
    </span>
  );
}

function PlayerNode({ player, style, currentSyllable }: PlayerNodeProps) {
  const isEliminated = player.isEliminated;
  const isActive = player.isActive;
  const isDisconnected = !player.isConnected;
  const displayedWord = player.currentWord;
  let playerNameClassName = "text-white/90";
  let avatarClassName = "border-white/20";

  if (isEliminated) {
    playerNameClassName = "text-muted-foreground/50 italic line-through";
    avatarClassName = "border-muted-foreground/30 opacity-50 grayscale";
  } else if (isDisconnected) {
    playerNameClassName = "text-white/40";
    avatarClassName = "border-white/10 opacity-60";
  } else if (isActive) {
    playerNameClassName = "text-amber-300";
    avatarClassName = "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]";
  }

  return (
    <div
      className="absolute flex flex-col items-center gap-1 transition-all duration-500"
      style={{
        ...style,
        transform: `${style.transform ?? ""} translate(-50%, -50%)`,
      }}
    >
      <span
        className={`max-w-30 truncate font-semibold text-xs ${playerNameClassName}`}
      >
        {player.name}
      </span>

      <div className="flex gap-0.5">
        {Array.from(
          { length: player.maxLives },
          (_, lifeNumber) => lifeNumber + 1
        ).map((lifeNumber) => (
          <Heart
            className={`h-3 w-3 ${
              lifeNumber <= player.lives
                ? "fill-red-500 text-red-500"
                : "fill-red-900/40 text-red-900/40"
            }`}
            key={`${player.id}-life-${lifeNumber}`}
          />
        ))}
      </div>

      <div
        className={`relative h-14 w-14 overflow-hidden rounded-sm border-2 transition-all duration-300 ${avatarClassName}`}
      >
        <div
          className="flex h-full w-full items-center justify-center font-bold text-lg text-white"
          style={{
            backgroundColor: isEliminated ? "#555" : player.avatarColor,
          }}
        >
          {isEliminated ? (
            <Skull className="h-6 w-6 text-white/60" />
          ) : (
            player.name.slice(0, 2).toUpperCase()
          )}
        </div>

        {isActive && (
          <div className="absolute inset-0 animate-pulse rounded-sm bg-amber-400/10" />
        )}
      </div>

      {displayedWord && (
        <span className="font-mono text-xs tracking-wider">
          {highlightSyllable(displayedWord, currentSyllable)}
        </span>
      )}

      {!isEliminated && isDisconnected && (
        <span className="text-[10px] text-white/35 uppercase tracking-wide">
          Reconnecting
        </span>
      )}
    </div>
  );
}

interface PlayerCircleProps {
  currentSyllable: string;
  players: Player[];
}

export function PlayerCircle({ players, currentSyllable }: PlayerCircleProps) {
  const centerX = 50;
  const centerY = 50;
  const radiusX = 38;
  const radiusY = 40;

  return (
    <div className="relative h-full w-full">
      {players.map((player, index) => {
        const angle = (2 * Math.PI * index) / players.length - Math.PI / 2;
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        return (
          <PlayerNode
            currentSyllable={currentSyllable}
            key={player.id}
            player={player}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          />
        );
      })}
    </div>
  );
}
