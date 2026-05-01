import { Flame, Percent, Swords, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface ProfileStats {
  bestStreak: number;
  gamesPlayed: number;
  losses: number;
  winRate: number;
  wins: number;
}

interface RecentGame {
  id: number;
  players: number;
  result: "win" | "loss";
  time: string;
}

interface ProfileResponse {
  recentGames?: RecentGame[];
  stats?: ProfileStats;
  success?: boolean;
  user?: {
    createdAt?: string | null;
    id: number;
    lastGameAt?: string | null;
    username: string;
    avatarColor: string;
  };
}

const AVATAR_COLORS = [
  { value: "#a855f7", label: "Purple" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#f97316", label: "Orange" },
  { value: "#ec4899", label: "Pink" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f59e0b", label: "Amber" },
];

const EMPTY_STATS: ProfileStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  bestStreak: 0,
};
const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0]?.value ?? "#a855f7";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, getProfileData, updateAvatarColor } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(
    user?.avatarColor ?? DEFAULT_AVATAR_COLOR
  );
  const [isSavingAvatarColor, setIsSavingAvatarColor] = useState(false);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";
  const memberSince = data?.user?.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString()
    : "Unknown";
  const lastPlayed = data?.user?.lastGameAt
    ? new Date(data.user.lastGameAt).toLocaleString()
    : "No games recorded";

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    getProfileData(user.username)
      .then((response) => {
        const profileResponse = response as ProfileResponse;

        if (profileResponse.success) {
          setData(profileResponse);
          setSelectedAvatarColor(
            profileResponse.user?.avatarColor ??
              user?.avatarColor ??
              DEFAULT_AVATAR_COLOR
          );
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

  async function handleAvatarColorSelect(avatarColor: string) {
    if (!user || isSavingAvatarColor || avatarColor === selectedAvatarColor) {
      return;
    }

    const previousAvatarColor = selectedAvatarColor;
    setSelectedAvatarColor(avatarColor);
    setIsSavingAvatarColor(true);

    const success = await updateAvatarColor(avatarColor);

    if (success) {
      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              user: currentData.user
                ? { ...currentData.user, avatarColor }
                : {
                    id: user.id,
                    username: user.username,
                    avatarColor,
                  },
            }
          : currentData
      );
      toast.success("Avatar color updated");
    } else {
      setSelectedAvatarColor(previousAvatarColor);
    }

    setIsSavingAvatarColor(false);
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
        <h1 className="font-bold text-sm text-white/60 uppercase tracking-widest">
          Profile
        </h1>
        <div className="w-10" />
      </div>

      <Card className="border-white/10 bg-zinc-800/80">
        <CardContent className="flex items-center gap-4 pt-6">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-bold text-white text-xl"
            style={{ backgroundColor: selectedAvatarColor }}
          >
            {initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-lg text-white">
              {user?.username ?? "Guest"}
            </p>
            <p className="text-white/40 text-xs">Member since {memberSince}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-white/10 bg-zinc-800/80">
          <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
            <Swords className="h-5 w-5 text-white/30" />
            <p className="font-black text-2xl text-white">
              {stats.gamesPlayed}
            </p>
            <p className="text-white/40 text-xs">Games played</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
            <Trophy className="h-5 w-5 text-amber-400" />
            <p className="font-black text-2xl text-amber-400">{stats.wins}</p>
            <p className="text-white/40 text-xs">Wins</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
            <Percent className="h-5 w-5 text-white/30" />
            <p className="font-black text-2xl text-white">{stats.winRate}%</p>
            <p className="text-white/40 text-xs">Win rate</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-800/80">
          <CardContent className="flex flex-col items-center gap-1 pt-5 pb-4">
            <Flame className="h-5 w-5 text-orange-400" />
            <p className="font-black text-2xl text-orange-400">
              {stats.bestStreak}
            </p>
            <p className="text-white/40 text-xs">Best streak</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-zinc-800/80">
        <CardContent className="flex items-center justify-between gap-4 pt-6 pb-6">
          <div>
            <p className="font-bold text-sm text-white">Record</p>
            <p className="text-white/40 text-xs">
              {stats.wins}W - {stats.losses}L
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm text-white">Last played</p>
            <p className="text-white/40 text-xs">{lastPlayed}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-800/80">
        <CardHeader className="pb-2">
          <CardTitle className="font-bold text-sm text-white/60 uppercase tracking-widest">
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
                <p className="font-bold text-sm text-white">
                  {game.players}-player lobby
                </p>
                <p className="text-white/40 text-xs">{game.time}</p>
              </div>
              <span
                className={`rounded-md px-3 py-1 font-bold text-xs ${
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
          <CardTitle className="font-bold text-sm text-white/60 uppercase tracking-widest">
            Avatar color
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {AVATAR_COLORS.map((color) => (
              <button
                aria-label={color.label}
                aria-pressed={selectedAvatarColor === color.value}
                className={`h-9 w-9 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-white/40 ${
                  selectedAvatarColor === color.value
                    ? "scale-110 ring-2 ring-white"
                    : "hover:scale-110"
                }`}
                key={color.label}
                onClick={() => {
                  handleAvatarColorSelect(color.value);
                }}
                style={{ backgroundColor: color.value }}
                type="button"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
