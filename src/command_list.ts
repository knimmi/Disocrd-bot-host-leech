import * as stats from './commands/stats.js';
import * as monthly from './commands/monthly.js';
import * as leaderboard from './commands/leaderboard.js';
import * as sync from './commands/admin/sync.js';
import * as manageStats from './commands/admin/manage-stats.js';

export const commands = [
    stats.data.toJSON(),
    monthly.data.toJSON(),
    leaderboard.data.toJSON(),
    sync.data.toJSON(),
    manageStats.data.toJSON()
];

export const commandModules = { stats, monthly, leaderboard, sync, manageStats };