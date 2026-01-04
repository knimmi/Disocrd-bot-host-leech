import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getLeaderboard, getGlobalTotalHosts } from "../database";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show global mission stats and top 10 hosts");

export async function execute(interaction: ChatInputCommandInteraction) {
  // Fetch global total and all-time top 10
  const totalGlobal = await getGlobalTotalHosts();
  const rows = await getLeaderboard(0); // 0 ensures we get all-time records

  const lbText = rows
    .map(
      (row: any, i: number) =>
        `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
    )
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("🏆 Global Mission Leaderboard")
    .setDescription(`A total of **${totalGlobal}** missions have been hosted!`)
    .addFields({
      name: "Top 10 Mission Hosts",
      value: lbText || "No data yet.",
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
