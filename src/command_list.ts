import * as stats from "./commands/stats";
import * as monthly from "./commands/monthly";
import * as leaderboard from "./commands/leaderboard";
import * as sync from "./commands/admin/sync";
import * as manageStats from "./commands/admin/manage-stats";
import * as transferStats from "./commands/admin/transfer";
import * as restartTaxi from "./commands/admin/restartTaxi";
import * as rewards from "./commands/alerts";
import * as refresh from "./commands/admin/refresh";
import * as jsonExport from "./commands/get-file";
import * as monthlystats from "./commands/monthly-stats";

export const commands = [
  stats.data.toJSON(),
  monthly.data.toJSON(),
  leaderboard.data.toJSON(),
  sync.data.toJSON(),
  manageStats.data.toJSON(),
  transferStats.data.toJSON(),
  restartTaxi.data.toJSON(),
  rewards.data.toJSON(),
  refresh.data.toJSON(),
  jsonExport.data.toJSON(),
  monthlystats.data.toJSON(),
];

export const commandModules = {
  stats,
  monthly,
  leaderboard,
  sync,
  manageStats,
  transferStats,
  restartTaxi,
  rewards,
  refresh,
  jsonExport,
  monthlystats,
};
