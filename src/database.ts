import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "missions.db"));

// 1. Initialize the table structure on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS mission_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    messageId TEXT DEFAULT NULL,
    botReplyId TEXT DEFAULT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_user_type ON mission_history(userId, type);
`);

/**
 * 2. MIGRATION LOGIC
 * Checks if the botReplyId column exists (for older databases) and adds it if missing.
 */
const tableInfo = db
  .prepare("PRAGMA table_info(mission_history)")
  .all() as any[];
const hasBotReplyId = tableInfo.some((col) => col.name === "botReplyId");

if (!hasBotReplyId) {
  console.log("🛠️ Database Migration: Adding botReplyId column...");
  try {
    db.exec(
      "ALTER TABLE mission_history ADD COLUMN botReplyId TEXT DEFAULT NULL;"
    );
  } catch (err: any) {
    console.error(
      "❌ Migration failed (column might already exist):",
      err.message
    );
  }
}

/**
 * Records a single mission (Host or Leech).
 */
export function recordMission(
  userId: string,
  type: "host" | "leech",
  messageId?: string
) {
  const insert = db.prepare(
    "INSERT INTO mission_history (userId, type, timestamp, messageId) VALUES (?, ?, ?, ?)"
  );
  insert.run(userId, type, Date.now(), messageId || null);

  const countStmt = db.prepare(
    "SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = ?"
  );
  const result = countStmt.get(userId, type) as { count: number };
  return result.count;
}

/**
 * Finds a record by messageId.
 * Essential for identifying the user when a message is deleted from Discord.
 */
export function getMissionByMessageId(messageId: string) {
  const stmt = db.prepare(
    "SELECT userId, type FROM mission_history WHERE messageId = ?"
  );
  return stmt.get(messageId) as
    | { userId: string; type: "host" | "leech" }
    | undefined;
}

/**
 * Updates a mission record with the ID of the bot's reply message.
 */
export function updateBotReplyId(messageId: string, botReplyId: string) {
  const stmt = db.prepare(
    "UPDATE mission_history SET botReplyId = ? WHERE messageId = ?"
  );
  return stmt.run(botReplyId, messageId);
}

/**
 * Retrieves the bot's reply message ID associated with a mission.
 */
export function getBotReplyId(messageId: string): string | null {
  const stmt = db.prepare(
    "SELECT botReplyId FROM mission_history WHERE messageId = ?"
  );
  const row = stmt.get(messageId) as { botReplyId: string } | undefined;
  return row ? row.botReplyId : null;
}

/**
 * Deletes a record by messageId.
 */
export function deleteMissionByMessage(messageId: string) {
  const stmt = db.prepare("DELETE FROM mission_history WHERE messageId = ?");
  const info = stmt.run(messageId);
  return info.changes > 0;
}

/**
 * Fetches stats (Hosts and Leeches) for a single user.
 */
export function getUserStats(userId: string) {
  const stmt = db.prepare(
    "SELECT type, COUNT(*) as count FROM mission_history WHERE userId = ? GROUP BY type"
  );
  const rows = stmt.all(userId) as any[];

  let hosts = 0,
    leeches = 0;
  rows.forEach((row) => {
    if (row.type === "host") hosts = row.count;
    if (row.type === "leech") leeches = row.count;
  });

  return { hosts, leeches, total: hosts + leeches };
}

/**
 * Fetches the global total of all missions hosted on the server.
 */
export function getGlobalTotalHosts() {
  const stmt = db.prepare(
    "SELECT COUNT(*) as total FROM mission_history WHERE type = 'host'"
  );
  const result = stmt.get() as { total: number };
  return result.total || 0;
}

/**
 * Leaderboard function for top 10 hosts.
 */
export function getLeaderboard(startTime: number = 0) {
  const stmt = db.prepare(`
    SELECT userId, COUNT(*) as count 
    FROM mission_history 
    WHERE timestamp >= ? AND type = 'host' 
    GROUP BY userId 
    ORDER BY count DESC 
    LIMIT 10
  `);
  return stmt.all(startTime);
}

/**
 * High-speed bulk recording (useful for manual syncs or migrations).
 */
export function recordMultipleMissions(
  userId: string,
  type: "host" | "leech",
  amount: number
) {
  const insert = db.prepare(
    "INSERT INTO mission_history (userId, type, timestamp, messageId) VALUES (?, ?, ?, NULL)"
  );

  const bulkInsert = db.transaction((uid: string, t: string, qty: number) => {
    const now = Date.now();
    for (let i = 0; i < qty; i++) {
      insert.run(uid, t, now);
    }
  });

  bulkInsert(userId, type, amount);

  const countStmt = db.prepare(
    "SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = ?"
  );
  const result = countStmt.get(userId, type) as { count: number };
  return result.count;
}

export { db };
