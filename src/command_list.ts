import * as stats from './commands/stats.js';
import * as monthly from './commands/monthly.js';
import * as leaderboard from './commands/leaderboard.js';
import * as sync from './commands/sync.js';

export const commands = [
    stats.data.toJSON(),
    monthly.data.toJSON(),
    leaderboard.data.toJSON(),
    sync.data.toJSON()
];

export const commandModules = { stats, monthly, leaderboard, sync };