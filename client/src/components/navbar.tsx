import { Bomb, ChevronDown, LogIn, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-amber-500",
];

function getAvatarColor(username: string) {
  const hash = username.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuth();

  function goToLogin(mode: "login" | "register") {
    navigate(`/login?mode=${mode}`);
  }

  return (
    <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <button
          className="flex items-center gap-3"
          onClick={() => navigate("/")}
          type="button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-600 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Bomb className="h-5 w-5 text-black" />
          </div>
          <span className="font-black text-lg tracking-tight text-white">
            Bomb Party
          </span>
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isGuest ? (
                <>
                  <span className="hidden text-sm text-white/80 sm:inline">
                    {user.username}
                  </span>
                  <Button
                    className="border-white/10 text-white hover:bg-white/5"
                    onClick={() => goToLogin("login")}
                    size="sm"
                    variant="outline"
                  >
                    <LogIn className="mr-1 h-4 w-4" />
                    Sign in
                  </Button>
                  <Button
                    className="bg-zinc-800 text-white hover:bg-zinc-700"
                    onClick={logout}
                    size="sm"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Leave guest
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/80 py-1 pr-2 pl-1 text-left transition-colors hover:bg-zinc-800/80"
                      type="button"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(user.username)}`}
                      >
                        {getInitials(user.username)}
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.username}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border border-white/10 bg-zinc-900 text-white"
                  >
                    <DropdownMenuLabel className="px-3 py-2 text-white">
                      <div className="flex flex-col">
                        <span className="text-xs text-white/50 uppercase tracking-wider">
                          Signed in as
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {user.username}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer px-3 py-2 focus:bg-white/5 focus:text-white"
                      onClick={() => navigate("/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer px-3 py-2 focus:bg-white/5 focus:text-white"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <>
              <Button
                className="border-white/10 text-white hover:bg-white/5"
                onClick={() => goToLogin("login")}
                size="sm"
                variant="outline"
              >
                Sign in
              </Button>
              <Button
                className="bg-amber-500 font-semibold text-black hover:bg-amber-400"
                onClick={() => goToLogin("register")}
                size="sm"
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
