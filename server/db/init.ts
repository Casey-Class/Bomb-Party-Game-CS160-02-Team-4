import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(import.meta.dir, "bomb-party.sqlite");
export const db = new Database(dbPath, { create: true });

const initStatements = [
  "PRAGMA foreign_keys = ON;",
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#a855f7',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_user_id INTEGER NOT NULL,
    finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(game_id, user_id)
  );`,
  "CREATE INDEX IF NOT EXISTS idx_games_winner_user_id ON games(winner_user_id);",
  "CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);",
] as const;

for (const statement of initStatements) {
  db.run(statement);
}

const userColumns = db
  .query("PRAGMA table_info(users);")
  .all() as Array<{ name: string }>;

if (!userColumns.some((column) => column.name === "avatar_color")) {
  db.run(
    "ALTER TABLE users ADD COLUMN avatar_color TEXT NOT NULL DEFAULT '#a855f7';",
  );
}

console.log(`SQLite ready at ${dbPath}`);
