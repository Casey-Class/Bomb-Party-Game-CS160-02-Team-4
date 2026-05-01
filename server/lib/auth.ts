import bcrypt from 'bcryptjs';
import { db } from '../db/init';

const SALT_ROUNDS = 12;

export interface User {
  id: number;
  username: string;
  password_hash: string;
  avatar_color: string;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, password: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
      RETURNING id, username, password_hash, avatar_color, created_at
    `);
    
    const user = stmt.get(username, passwordHash) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const stmt = db.prepare(`
      SELECT id, username, password_hash, avatar_color, created_at
      FROM users
      WHERE username = ?
    `);
    
    const user = stmt.get(username) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const stmt = db.prepare(`
      SELECT id, username, password_hash, avatar_color, created_at
      FROM users
      WHERE id = ?
    `);
    
    const user = stmt.get(id) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function updateUserAvatarColor(
  id: number,
  avatarColor: string,
): Promise<User | null> {
  try {
    const stmt = db.prepare(`
      UPDATE users
      SET avatar_color = ?
      WHERE id = ?
      RETURNING id, username, password_hash, avatar_color, created_at
    `);

    const user = stmt.get(avatarColor, id) as User | undefined;
    return user || null;
  } catch (error) {
    console.error("Error updating avatar color:", error);
    return null;
  }
}

interface CompletedGameParticipant {
  playerId: string;
  playerName: string;
  userId: number | null;
}

export function recordCompletedGameForUsers({
  finishedAt,
  participants,
  winnerUserId,
}: {
  finishedAt: string;
  participants: CompletedGameParticipant[];
  winnerUserId: number | null;
}) {
  const uniqueParticipants = [
    ...new Map(
      participants.map((participant) => [participant.playerId, participant]),
    ).values(),
  ];

  if (uniqueParticipants.length === 0) {
    return;
  }

  const insertGame = db.prepare(`
    INSERT INTO games (winner_user_id, finished_at)
    VALUES (?, ?)
    RETURNING id
  `);
  const insertParticipant = db.prepare(`
    INSERT INTO game_participants (game_id, player_id, player_name, user_id)
    VALUES (?, ?, ?, ?)
  `);
  db.transaction(() => {
    const createdGame = insertGame.get(winnerUserId, finishedAt) as
      | { id: number }
      | undefined;

    if (!createdGame) {
      throw new Error("Failed to create completed game record");
    }

    for (const participant of uniqueParticipants) {
      insertParticipant.run(
        createdGame.id,
        participant.playerId,
        participant.playerName,
        participant.userId,
      );
    }
  })();
}
