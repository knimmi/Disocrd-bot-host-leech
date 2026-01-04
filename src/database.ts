import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

export async function recordMission(userId: string, type: 'host' | 'leech') {
    await pool.execute('INSERT INTO mission_history (userId, type, timestamp) VALUES (?, ?, ?)', [userId, type, Date.now()]);
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = ?', [userId, type]) as any;
    return count;
}

export async function getUserStats(userId: string) {
    const [rows] = await pool.execute('SELECT type, COUNT(*) as count FROM mission_history WHERE userId = ? GROUP BY type', [userId]) as any;
    let hosts = 0, leeches = 0;
    rows.forEach((row: any) => {
        if (row.type === 'host') hosts = row.count;
        if (row.type === 'leech') leeches = row.count;
    });
    return { hosts, leeches, total: hosts + leeches };
}

export async function getLeaderboard(startTime: number = 0) {
    const [rows] = await pool.execute(
        'SELECT userId, COUNT(*) as count FROM mission_history WHERE timestamp >= ? AND type = "host" GROUP BY userId ORDER BY count DESC LIMIT 10',
        [startTime]
    ) as any;
    return rows;
}

export async function getGlobalTotalHosts() {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM mission_history WHERE type = "host"') as any;
    return total || 0;
}