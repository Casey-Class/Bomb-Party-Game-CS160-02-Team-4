import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
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
  const loggedInUsername = isAuthenticated && user ? user.username : null;
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const canJoinRoom = normalizedRoomCode.length === 6;

  useEffect(() => {
    if (user) {
      setPlayerName(user.username);
    } else {
      setPlayerName(getStoredPlayerName());
    }
  }, [user]);

  function ensurePlayerIdentity() {
    const normalizedPlayerName = loggedInUsername?.trim() ?? playerName.trim();

    if (!normalizedPlayerName) {
      toast.error("Enter a name first");
      return false;
    }

    storePlayerName(normalizedPlayerName);

    if (!(isAuthenticated || isGuest)) {
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
        <p className="max-w-sm text-sm text-white/70 leading-relaxed">
          Type words containing the given syllable before the bomb explodes!
          Last player standing wins.
        </p>

        <div className="flex items-center gap-1.5 text-white/60 text-xs">
          <Users className="h-4 w-4" />
          <span>Up to 20 players</span>
        </div>

        <div className="flex w-full flex-col gap-3">
          {loggedInUsername ? null : (
            <Input
              className="h-11 border-white/10 bg-zinc-800/80 text-white placeholder:text-white/30"
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Your name"
              value={playerName}
            />
          )}

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();

              if (!canJoinRoom) {
                return;
              }

              goToRoom(normalizedRoomCode);
            }}
          >
            <Input
              className="h-11 border-white/10 bg-zinc-800/80 text-white placeholder:text-white/30"
              maxLength={6}
              onChange={(event) =>
                setRoomCode(event.target.value.replace(/\s+/g, "").toUpperCase())
              }
              placeholder="Room code"
              value={roomCode}
            />
            <Button
              className="h-11 bg-zinc-800 px-5 font-bold text-white hover:bg-zinc-700"
              disabled={!canJoinRoom}
              type="submit"
            >
              Join
            </Button>
          </form>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-x-0 h-px bg-white/10" />
            <span className="relative px-3 font-semibold text-white/75 text-xs uppercase tracking-[0.2em]">
              or
            </span>
          </div>

          <Button
            className="bg-amber-500 px-8 py-6 font-bold text-base text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            onClick={() => goToRoom(generateRoomId())}
            size="lg"
          >
            Create Room
          </Button>
        </div>
      </div>
    </main>
  );
}
