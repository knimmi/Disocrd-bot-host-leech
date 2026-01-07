import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getLeaderboard, getGlobalTotalHosts } from "../database.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show global mission stats and top 10 hosts");

export async function execute(interaction: ChatInputCommandInteraction) {
  const totalGlobal = getGlobalTotalHosts();
  const rows = getLeaderboard(0) as any[]; // 0 ensures all-time records

  const lbText =
    rows.length > 0
      ? rows
          .map(
            (row, i) =>
              `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
          )
          .join("\n")
      : "No data yet.";

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("🏆 Global Mission Leaderboard")
    .setDescription(`A total of **${totalGlobal}** missions have been hosted!`)
    .addFields({
      name: "Top 10 Mission Hosts",
      value: lbText,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
