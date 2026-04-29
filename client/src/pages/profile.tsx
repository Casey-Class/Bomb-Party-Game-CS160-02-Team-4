import { LogOut, Trophy, Swords, Percent, Flame } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const AVATAR_COLORS = [
  { bg: "bg-purple-500", label: "Purple" },
  { bg: "bg-teal-500", label: "Teal" },
  { bg: "bg-orange-500", label: "Orange" },
  { bg: "bg-pink-500", label: "Pink" },
  { bg: "bg-blue-500", label: "Blue" },
  { bg: "bg-amber-500", label: "Amber" },
];

// Placeholder stats — swap these out with real API data when the backend is ready
const MOCK_STATS = {
  gamesPlayed: 48,
  wins: 21,
  winRate: 44,
  bestStreak: 5,
};

const MOCK_RECENT_GAMES = [
  { id: 1, players: 4, result: "win", time: "2 hours ago" },
  { id: 2, players: 3, result: "loss", time: "Yesterday" },
  { id: 3, players: 2, result: "win", time: "2 days ago" },
  { id: 4, players: 5, result: "loss", time: "3 days ago" },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-svh flex-col items-center bg-zinc-900 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <button
            onClick={() => navigate("/home")}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-sm font-bold text-white/60 tracking-widest uppercase">
            Profile
          </h1>
          <div className="w-10" />
        </div>

        {/* Avatar + username */}
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
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="ml-auto text-white/40 hover:text-white/70 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Swords className="h-5 w-5 text-white/30" />
              <p className="text-2xl font-black text-white">
                {MOCK_STATS.gamesPlayed}
              </p>
              <p className="text-xs text-white/40">Games played</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Trophy className="h-5 w-5 text-amber-400" />
              <p className="text-2xl font-black text-amber-400">
                {MOCK_STATS.wins}
              </p>
              <p className="text-xs text-white/40">Wins</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Percent className="h-5 w-5 text-white/30" />
              <p className="text-2xl font-black text-white">
                {MOCK_STATS.winRate}%
              </p>
              <p className="text-xs text-white/40">Win rate</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-800/80">
            <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
              <Flame className="h-5 w-5 text-orange-400" />
              <p className="text-2xl font-black text-orange-400">
                {MOCK_STATS.bestStreak}
              </p>
              <p className="text-xs text-white/40">Best streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent games */}
        <Card className="border-white/10 bg-zinc-800/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white/60 tracking-widest uppercase">
              Recent games
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {MOCK_RECENT_GAMES.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-4 py-3"
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

        {/* Avatar color picker */}
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
                  key={color.label}
                  aria-label={color.label}
                  className={`h-9 w-9 rounded-full ${color.bg} transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
