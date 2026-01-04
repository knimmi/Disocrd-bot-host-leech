import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

// Create the connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Records multiple missions in a single query for high-performance bulk updates.
 */
export async function recordMultipleMissions(
  userId: string,
  type: "host" | "leech",
  amount: number
): Promise<number> {
  const now = Date.now();

  // 1. Prepare the bulk data array [[userId, type, timestamp, null], ...]
  const values = Array.from({ length: amount }, () => [
    userId,
    type,
    now,
    null, // No messageId for bulk admin additions
  ]);

  // 2. Execute Bulk Insert using .query (not .execute) because .query supports arrays
  await pool.query(
    "INSERT INTO mission_history (userId, type, timestamp, messageId) VALUES ?",
    [values]
  );

  // 3. Fetch the updated total count
  const [[{ count }]] = (await pool.execute(
    "SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = ?",
    [userId, type]
  )) as any;

  return count;
}

/**
 * Records a single mission event (used for message tracking).
 */
export async function recordMission(
  userId: string,
  type: "host" | "leech",
  messageId?: string
) {
  await pool.execute(
    "INSERT INTO mission_history (userId, type, timestamp, messageId) VALUES (?, ?, ?, ?)",
    [userId, type, Date.now(), messageId || null]
  );

  const [[{ count }]] = (await pool.execute(
    "SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = ?",
    [userId, type]
  )) as any;

  return count;
}

/**
 * Deletes a mission record based on its associated Discord message ID.
 */
export async function deleteMissionByMessage(messageId: string) {
  const [result] = (await pool.execute(
    "DELETE FROM mission_history WHERE messageId = ?",
    [messageId]
  )) as any;

  return result.affectedRows > 0;
}

/**
 * Fetches host, leech, and total counts for a single user.
 */
export async function getUserStats(userId: string) {
  const [rows] = (await pool.execute(
    "SELECT type, COUNT(*) as count FROM mission_history WHERE userId = ? GROUP BY type",
    [userId]
  )) as any;

  let hosts = 0,
    leeches = 0;
  rows.forEach((row: any) => {
    if (row.type === "host") hosts = row.count;
    if (row.type === "leech") leeches = row.count;
  });

  return { hosts, leeches, total: hosts + leeches };
}

/**
 * Fetches the top 10 hosts based on a starting timestamp.
 */
export async function getLeaderboard(startTime: number = 0) {
  const [rows] = (await pool.execute(
    'SELECT userId, COUNT(*) as count FROM mission_history WHERE timestamp >= ? AND type = "host" GROUP BY userId ORDER BY count DESC LIMIT 10',
    [startTime]
  )) as any;
  return rows;
}

/**
 * Fetches the total number of missions hosted globally.
 */
export async function getGlobalTotalHosts() {
  const [[{ total }]] = (await pool.execute(
    'SELECT COUNT(*) as total FROM mission_history WHERE type = "host"'
  )) as any;
  return total || 0;
}
