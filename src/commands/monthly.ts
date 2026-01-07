import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getLeaderboard } from "../database.js";

export const data = new SlashCommandBuilder()
  .setName("monthly")
  .setDescription("Show top 10 hosts for this month");

export async function execute(interaction: ChatInputCommandInteraction) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const rows = getLeaderboard(startOfMonth) as any[];

  const lbText =
    rows.length > 0
      ? rows
          .map(
            (row, i) =>
              `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
          )
          .join("\n")
      : "No missions hosted this month yet!";

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(
      `🏆 Top Hosts - ${now.toLocaleString("en-US", { month: "long" })}`
    )
    .setDescription(lbText)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
