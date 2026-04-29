import { Bomb, Users, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStoredPlayerName, storePlayerName } from "@/lib/player-identity";
import { useAuth } from "@/hooks/use-auth";

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    if (user) {
      setPlayerName(user.username);
    } else {
      setPlayerName(getStoredPlayerName());
    }
  }, [user]);

  function goToRoom(nextRoomCode: string) {
    const normalizedRoomCode = nextRoomCode.trim().toUpperCase();
    storePlayerName(playerName);

    navigate(`/game/${normalizedRoomCode}`);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-900 p-6">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-600 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
            <Bomb className="h-10 w-10 text-black" />
          </div>
          <h1 className="font-black text-4xl text-white tracking-tight">
            Bomb Party
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Type words containing the given syllable before the bomb explodes!
            Last player standing wins.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Up to 20 players</span>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-white/60">
                  {isGuest ? "Guest" : "Logged in"}: {user.username}
                </span>
                {!isGuest && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/profile")}
                      className="h-6 px-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5"
                    >
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="h-6 px-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/5"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
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
            className="bg-amber-500 px-8 py-6 font-bold text-base text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            onClick={() => goToRoom(generateRoomId())}
            size="lg"
          >
            Create Room
          </Button>
        </div>

        <p className="text-white/20 text-xs">
          Press{" "}
          <kbd className="rounded border border-white/10 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-white/40">
            d
          </kbd>{" "}
          to toggle dark mode
        </p>
      </div>
    </div>
  );
}
