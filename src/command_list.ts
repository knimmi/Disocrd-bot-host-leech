import * as stats from "./commands/stats";
import * as monthly from "./commands/monthly";
import * as leaderboard from "./commands/leaderboard";
import * as sync from "./commands/admin/sync";
import * as manageStats from "./commands/admin/manage-stats";
import * as transferStats from "./commands/admin/transfer";
import * as restartTaxi from "./commands/admin/restartTaxi";

export const commands = [
  stats.data.toJSON(),
  monthly.data.toJSON(),
  leaderboard.data.toJSON(),
  sync.data.toJSON(),
  manageStats.data.toJSON(),
  transferStats.data.toJSON(),
  restartTaxi.data.toJSON(),
];

export const commandModules = {
  stats,
  monthly,
  leaderboard,
  sync,
  manageStats,
  transferStats,
  restartTaxi,
};
