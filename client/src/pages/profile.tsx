import { Flame, LogOut, Percent, Swords, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface ProfileStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  bestStreak: number;
}

interface RecentGame {
  id: number;
  players: number;
  result: "win" | "loss";
  time: string;
}

interface ProfileResponse {
  success?: boolean;
  stats?: ProfileStats;
  recentGames?: RecentGame[];
}

const AVATAR_COLORS = [
  { bg: "bg-purple-500", label: "Purple" },
  { bg: "bg-teal-500", label: "Teal" },
  { bg: "bg-orange-500", label: "Orange" },
  { bg: "bg-pink-500", label: "Pink" },
  { bg: "bg-blue-500", label: "Blue" },
  { bg: "bg-amber-500", label: "Amber" },
];

const EMPTY_STATS: ProfileStats = {
  gamesPlayed: 0,
  wins: 0,
  winRate: 0,
  bestStreak: 0,
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, getProfileData } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    getProfileData(user.username)
      .then((response: ProfileResponse) => {
        if (response.success) {
          setData(response);
        }
      })
      .catch((error) => console.error("Profile fetch error:", error))
      .finally(() => setLoading(false));
  }, [getProfileData, user]);

  if (loading) {
    return <div className="p-10 text-white">Loading stats...</div>;
  }

  const stats = data?.stats ?? EMPTY_STATS;
  const recentGames = data?.recentGames ?? [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-74px)] w-full max-w-md flex-col gap-4 p-6">
        <div className="flex items-center justify-between py-2">
          <button
            className="text-sm text-white/40 transition-colors hover:text-white/70"
            onClick={() => navigate("/")}
            type="button"
          >
            {"<- Back"}
          </button>
          <h1 className="text-sm font-bold text-white/60 tracking-widest uppercase">
            Profile
          </h1>
          <div className="w-10" />
        </div>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-xl font-bold text-white">
              {initials}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-lg font-bold text-white">
                {user?.username ?? "Guest"}
              </p>
              <p className="text-xs text-white/40">Member since March 2025</p>
            </div>
            <Button
              className="ml-auto text-white/40 hover:bg-white/5 hover:text-white/70"
              onClick={handleLogout}
              size="sm"
              variant="ghost"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Swords className="h-5 w-5 text-white/30" />
              <p className="text-2xl font-black text-white">
                {stats.gamesPlayed}
              </p>
              <p className="text-xs text-white/40">Games played</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Trophy className="h-5 w-5 text-amber-400" />
              <p className="text-2xl font-black text-amber-400">
                {stats.wins}
              </p>
              <p className="text-xs text-white/40">Wins</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Percent className="h-5 w-5 text-white/30" />
              <p className="text-2xl font-black text-white">
                {stats.winRate}%
              </p>
              <p className="text-xs text-white/40">Win rate</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Flame className="h-5 w-5 text-orange-400" />
              <p className="text-2xl font-black text-orange-400">
                {stats.bestStreak}
              </p>
              <p className="text-xs text-white/40">Best streak</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white/60 tracking-widest uppercase">
              Recent games
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentGames.map((game) => (
              <div
                className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-4 py-3"
                key={game.id}
              >
                <div>
                  <p className="text-sm font-bold text-white">
                    {game.players}-player lobby
                  </p>
                  <p className="text-xs text-white/40">{game.time}</p>
                </div>
                <span
                  className={`rounded-md px-3 py-1 text-xs font-bold ${
                    game.result === "win"
                      ? "bg-teal-500/20 text-teal-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {game.result === "win" ? "Win" : "Loss"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white/60 tracking-widest uppercase">
              Avatar color
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  aria-label={color.label}
                  className={`h-9 w-9 rounded-full ${color.bg} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40`}
                  key={color.label}
                  type="button"
                />
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
