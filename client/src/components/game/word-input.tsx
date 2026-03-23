import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { type Player, type GameState } from "@/data/mock-game"

interface WordInputProps {
  currentPlayer: Player | undefined
  gameState: GameState
  typedWord: string
  onTypedWordChange: (word: string) => void
  isLocalPlayer?: boolean
}

export function WordInput({
  currentPlayer,
  gameState,
  typedWord,
  onTypedWordChange,
  isLocalPlayer = true,
}: WordInputProps) {
  const isMyTurn = isLocalPlayer && currentPlayer?.isActive

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typedWord.trim() || !isMyTurn) return
    onTypedWordChange("")
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-2">
        <span className="text-sm font-medium text-white/70">
          {isMyTurn ? (
            <span className="text-amber-400 font-bold animate-pulse">
              Your Turn! Type a word containing &quot;
              {gameState.currentSyllable}&quot;
            </span>
          ) : (
            <span>
              Waiting for{" "}
              <span className="text-white font-semibold">
                {currentPlayer?.name ?? "..."}
              </span>
            </span>
          )}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          id="word-input"
          value={typedWord}
          onChange={(e) => onTypedWordChange(e.target.value.toUpperCase())}
          placeholder={
            isMyTurn
              ? `Type a word with "${gameState.currentSyllable}"...`
              : "Not your turn"
          }
          disabled={!isMyTurn}
          className="bg-zinc-800/80 border-white/10 text-white placeholder:text-white/30 font-mono tracking-wider text-center text-lg"
          autoComplete="off"
          autoFocus={isMyTurn}
        />
        <Button
          type="submit"
          disabled={!isMyTurn || !typedWord.trim()}
          size="icon"
          className="bg-amber-500 hover:bg-amber-400 text-black shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

