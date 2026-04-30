// server/endpoints/profile.ts
import { db } from "../db/init";
import { extractTokenFromHeader, verifyToken } from "../lib/jwt";
import { getUserById, updateUserAvatarColor } from "../lib/auth";

const VALID_AVATAR_COLORS = new Set([
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#3b82f6",
  "#f59e0b",
]);

export const profileEndpoint = async (req: Request) => {
    try{
    if (req.method === "PUT") {
        const authHeader = req.headers.get("Authorization");
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return Response.json({ success: false, message: "No token provided" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return Response.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
        }

        const body = await req.json().catch(() => null) as { avatarColor?: string } | null;
        const avatarColor = body?.avatarColor?.trim();

        if (!avatarColor || !VALID_AVATAR_COLORS.has(avatarColor)) {
            return Response.json({ success: false, message: "Invalid avatar color" }, { status: 400 });
        }

        const updatedUser = await updateUserAvatarColor(payload.userId, avatarColor);

        if (!updatedUser) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }

        return Response.json({
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                avatarColor: updatedUser.avatar_color
            }
        });
    }

    const url = new URL(req.url);
    // Get username from query param (e.g., /api/auth/profile?username=casey)
    const username = url.searchParams.get("username");

    if (!username) {
        return Response.json({ success: false, message: "Username required" }, { status: 400 });
    }

    const user = db.query("SELECT id FROM users WHERE username = ?").get(username) as { id: number } | null;

    if (!user) {
        return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const profileUser = await getUserById(user.id);

    if (!profileUser) {
        return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const totalGames = db.query("SELECT COUNT(*) as count FROM game_participants WHERE user_id = ?").get(user.id) as { count: number };
    const wins = db.query("SELECT COUNT(*) as count FROM games WHERE winner_user_id = ?").get(user.id) as { count: number };

    const recentGames = db.query(`
    SELECT g.id, g.winner_user_id, g.finished_at,
    (SELECT COUNT(*) FROM game_participants WHERE game_id = g.id) as player_count
    FROM games g
    JOIN game_participants gp ON g.id = gp.game_id
    WHERE gp.user_id = ?
    ORDER BY g.finished_at DESC LIMIT 5
  `).all(user.id);

    const allGames = db.query(`
  SELECT g.winner_user_id 
  FROM games g
  JOIN game_participants gp ON g.id = gp.game_id
  WHERE gp.user_id = ?
  ORDER BY g.finished_at ASC
`).all(user.id) as { winner_user_id: number }[];

    let bestStreak = 0;
    let currentStreak = 0;

    for (const game of allGames) {
        if (game.winner_user_id === user.id) {
            // If they won, increase the current streak
            currentStreak++;
            // If current streak is now the highest, update bestStreak
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
            }
        } else {
            // If they lost, reset the current streak to zero
            currentStreak = 0;
        }
    }

    return Response.json({
        success: true,
        user: {
            id: profileUser.id,
            username: profileUser.username,
            avatarColor: profileUser.avatar_color
        },
        stats: {
            gamesPlayed: totalGames.count,
            wins: wins.count,
            winRate: totalGames.count > 0 ? Math.round((wins.count / totalGames.count) * 100) : 0,
            bestStreak: bestStreak
        },
        recentGames: recentGames.map((g: any) => ({
            id: g.id,
            players: g.player_count,
            result: g.winner_user_id === user.id ? "win" : "loss",
            time: g.finished_at ? new Date(g.finished_at).toLocaleDateString() : "Unknown"
        }))
    });} catch (error) {
        console.error("Profile Endpoint Error:", error);
        return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
};
