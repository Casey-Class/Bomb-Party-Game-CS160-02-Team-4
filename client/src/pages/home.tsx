import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router"
import { Bomb, Users } from "lucide-react"

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-900 p-6">
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)]">
            <Bomb className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Bomb Party
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Type words containing the given syllable before the bomb
            explodes! Last player standing wins.
          </p>
        </div>

        <div className="flex gap-6 text-white/40 text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Up to 20 players</span>
          </div>
        </div>

        <Button
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-base px-8 py-6 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all"
          onClick={() => navigate("/game")}
        >
          Join Game
        </Button>

        <p className="text-white/20 text-xs">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-white/10 rounded text-white/40 text-[10px]">
            d
          </kbd>{" "}
          to toggle dark mode
        </p>
      </div>
    </div>
  )
}
