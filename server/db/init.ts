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
    avatar_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_user_id INTEGER,
    finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(game_id, player_id)
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

if (!userColumns.some((column) => column.name === "avatar_url")) {
  db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT;");
}

const gameColumns = db.query("PRAGMA table_info(games);").all() as Array<{
  name: string;
  notnull: number;
}>;
const gameParticipantForeignKeys = db.query(
  "PRAGMA foreign_key_list(game_participants);",
).all() as Array<{ table: string }>;
const gameParticipantColumns = db.query(
  "PRAGMA table_info(game_participants);",
).all() as Array<{ name: string; notnull: number }>;

const winnerUserIdColumn = gameColumns.find(
  (column) => column.name === "winner_user_id",
);

if (winnerUserIdColumn?.notnull) {
  db.run("DROP INDEX IF EXISTS idx_games_winner_user_id;");
  db.run("ALTER TABLE games RENAME TO games_old;");
  db.run(`CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_user_id INTEGER,
    finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_user_id) REFERENCES users(id)
  );`);
  db.run(`
    INSERT INTO games (id, winner_user_id, finished_at)
    SELECT id, winner_user_id, finished_at
    FROM games_old;
  `);
  db.run("DROP TABLE games_old;");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_games_winner_user_id ON games(winner_user_id);",
  );
}

const shouldRebuildGameParticipants =
  gameParticipantForeignKeys.some((foreignKey) => foreignKey.table === "games_old") ||
  !gameParticipantColumns.some((column) => column.name === "player_id") ||
  !gameParticipantColumns.some((column) => column.name === "player_name") ||
  gameParticipantColumns.some(
    (column) => column.name === "user_id" && column.notnull,
  );

if (shouldRebuildGameParticipants) {
  db.run("ALTER TABLE game_participants RENAME TO game_participants_old;");
  db.run(`CREATE TABLE game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(game_id, player_id)
  );`);
  db.run(`
    INSERT INTO game_participants (id, game_id, player_id, player_name, user_id)
    SELECT
      id,
      game_id,
      CASE
        WHEN user_id IS NOT NULL THEN 'user-' || user_id
        ELSE 'legacy-participant-' || id
      END,
      COALESCE(
        (SELECT username FROM users WHERE users.id = game_participants_old.user_id),
        'Guest'
      ),
      user_id
    FROM game_participants_old;
  `);
  db.run("DROP TABLE game_participants_old;");
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_game_participants_player_id ON game_participants(player_id);",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);",
  );
}

const currentGameParticipantColumns = db.query(
  "PRAGMA table_info(game_participants);",
).all() as Array<{ name: string }>;

if (
  currentGameParticipantColumns.some(
    (column) => column.name === "player_id",
  )
) {
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_game_participants_player_id ON game_participants(player_id);",
  );
}

console.log(`SQLite ready at ${dbPath}`);
