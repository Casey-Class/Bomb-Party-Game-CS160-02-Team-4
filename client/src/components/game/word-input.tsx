import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameState, Player } from "@/data/mock-game";

interface WordInputProps {
  currentPlayer: Player | undefined;
  gameState: GameState;
  isLocalPlayer?: boolean;
  onSubmitWord?: (word: string) => void;
  onTypedWordChange: (word: string) => void;
  typedWord: string;
}

export function WordInput({
  currentPlayer,
  gameState,
  typedWord,
  onTypedWordChange,
  onSubmitWord,
  isLocalPlayer = true,
}: WordInputProps) {
  const isPlaying = gameState.status === "playing";
  const isMyTurn = isPlaying && isLocalPlayer && currentPlayer?.isActive;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasMyTurnRef = useRef(false);
  const [draftWord, setDraftWord] = useState(typedWord);
  const hasValidLength = draftWord.trim().length >= 3;
  let statusMessage: React.ReactNode = (
    <span>
      Waiting for{" "}
      <span className="font-semibold text-white">
        {currentPlayer?.name ?? "..."}
      </span>
    </span>
  );
  let inputPlaceholder = "Game not active";

  if (gameState.status === "waiting") {
    statusMessage = <span>Waiting for someone to start the game</span>;
  } else if (gameState.status === "ended") {
    statusMessage = (
      <span className="font-semibold text-emerald-300">Game over</span>
    );
  } else if (isMyTurn) {
    statusMessage = (
      <span className="animate-pulse font-bold text-amber-400">
        Your Turn! Type a word containing &quot;
        {gameState.currentSyllable}&quot;
      </span>
    );
  }

  if (isPlaying) {
    inputPlaceholder = isMyTurn
      ? `Type a word with "${gameState.currentSyllable}"...`
      : "Not your turn";
  }

  useEffect(() => {
    if (!isMyTurn) {
      setDraftWord("");
      wasMyTurnRef.current = false;
      return;
    }

    setDraftWord(typedWord);
  }, [isMyTurn, typedWord]);

  useEffect(() => {
    if (!isMyTurn || wasMyTurnRef.current) {
      return;
    }

    wasMyTurnRef.current = true;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isMyTurn]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!(isMyTurn && hasValidLength)) {
      return;
    }
    onSubmitWord?.(draftWord.trim());
    setDraftWord("");
    onTypedWordChange("");
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-2 text-center">
        <span className="font-medium text-sm text-white/70">
          {statusMessage}
        </span>
      </div>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          autoComplete="off"
          className="border-white/10 bg-zinc-800/80 text-center font-mono text-lg text-white tracking-wider placeholder:text-white/30"
          disabled={!isMyTurn}
          id="word-input"
          onChange={(e) => {
            const nextWord = e.target.value.toUpperCase();
            setDraftWord(nextWord);
            onTypedWordChange(nextWord);
          }}
          placeholder={inputPlaceholder}
          ref={inputRef}
          value={draftWord}
        />
        <Button
          className="shrink-0 bg-amber-500 text-black hover:bg-amber-400"
          disabled={!(isMyTurn && hasValidLength)}
          size="icon"
          type="submit"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
