import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getStoredPlayerName, storePlayerName } from "@/lib/player-identity";

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function HomePage() {
  const navigate = useNavigate();
  const { user, isGuest, isAuthenticated, loginAsGuest } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (user) {
      setPlayerName(user.username);
    } else {
      setPlayerName(getStoredPlayerName());
    }
  }, [user]);

  function ensurePlayerIdentity() {
    const normalizedPlayerName = playerName.trim();

    if (!normalizedPlayerName) {
      toast.error("Enter a name first");
      return false;
    }

    storePlayerName(normalizedPlayerName);

    if (!isAuthenticated && !isGuest) {
      loginAsGuest(normalizedPlayerName);
    }

    return true;
  }

  function goToRoom(nextRoomCode: string) {
    const normalizedRoomCode = nextRoomCode.trim().toUpperCase();

    if (!normalizedRoomCode) {
      return;
    }

    if (!ensurePlayerIdentity()) {
      return;
    }

    navigate(`/game/${normalizedRoomCode}`);
  }

  return (
    <main className="flex min-h-[calc(100svh-74px)] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <p className="max-w-sm text-sm leading-relaxed text-white/50">
          Type words containing the given syllable before the bomb explodes!
          Last player standing wins.
        </p>

        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Users className="h-4 w-4" />
          <span>Up to 20 players</span>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Input
            className="h-11 border-white/10 bg-zinc-800/80 text-white placeholder:text-white/30"
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Your name"
            value={playerName}
          />

          <div className="flex gap-2">
            <Input
              className="h-11 border-white/10 bg-zinc-800/80 text-white placeholder:text-white/30"
              onChange={(event) =>
                setRoomCode(event.target.value.toUpperCase())
              }
              placeholder="Room code"
              value={roomCode}
            />
            <Button
              className="bg-zinc-800 px-5 py-6 font-bold text-white hover:bg-zinc-700"
              disabled={!roomCode.trim()}
              onClick={() => goToRoom(roomCode)}
              size="lg"
            >
              Join
            </Button>
          </div>

          <Button
            className="bg-amber-500 px-8 py-6 text-base font-bold text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            onClick={() => goToRoom(generateRoomId())}
            size="lg"
          >
            Create Room
          </Button>
        </div>

        <p className="text-xs text-white/20">
          Press{" "}
          <kbd className="rounded border border-white/10 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white/40">
            d
          </kbd>{" "}
          to toggle dark mode
        </p>
      </div>
    </main>
  );
}
