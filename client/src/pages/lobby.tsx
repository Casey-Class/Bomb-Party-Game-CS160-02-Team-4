import { useState } from "react";
import { useNavigate } from "react-router";
import { Bomb, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-hot-toast";

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function LobbyPage() {
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth();
  const [roomCode, setRoomCode] = useState("");

  function joinRoom(roomId: string) {
    const normalizedRoomCode = roomId.trim().toUpperCase();
    if (normalizedRoomCode.length === 6) {
      navigate(`/game/${normalizedRoomCode}`);
    } else {
      toast.error("Invalid room code");
    }
  }

  function createRoom() {
    const newRoomId = generateRoomId();
    navigate(`/game/${newRoomId}`);
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-600 shadow-[0_0_40px_rgba(251,191,36,0.3)] mx-auto mb-4">
            <Bomb className="h-10 w-10 text-black" />
          </div>
          <h1 className="font-black text-4xl text-white tracking-tight mb-2">
            Bomb Party Lobby
          </h1>
          <p className="text-white/50">
            {isGuest ? `Playing as ${user?.username}` : `Welcome, ${user?.username}!`}
          </p>
          {!isGuest && (
              <Button
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="text-amber-400 hover:text-amber-300 p-0 h-auto"
              >
                View My Profile & Stats
              </Button>
          )}
          <Button
              variant="outline"
              className="text-zinc-400"
              onClick={logout}
          >
            Logout
          </Button>
        </div>



        <div className="grid md:grid-cols-2 gap-6">
          {/* Join Room */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Room
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter a room code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Button
                onClick={() => joinRoom(roomCode)}
                disabled={roomCode.length !== 6}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Create Room */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Room
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Start a new game and invite friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-700 rounded-lg p-4 text-center">
                <p className="text-zinc-300 text-sm mb-2">Create a new room with a unique code</p>
                <p className="text-amber-400 font-mono text-lg">XXXXXX</p>
              </div>
              <Button
                onClick={createRoom}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                Create New Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
