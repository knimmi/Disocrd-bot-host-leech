import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getUserMonthlyStats } from "../database.js";

export const data = new SlashCommandBuilder()
  .setName("monthly-stats")
  .setDescription("Show STW mission stats for the current month")
  .addUserOption((opt) =>
    opt.setName("target").setDescription("The user to check")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("target") || interaction.user;
  const { hosts, leeches, total } = await getUserMonthlyStats(target.id);

  const hRatio = total > 0 ? Math.round((hosts / total) * 100) : 0;
  const lRatio = total > 0 ? Math.round((leeches / total) * 100) : 0;

  const currentMonthName = new Date().toLocaleString("default", {
    month: "long",
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Monthly Stats: ${currentMonthName}`)
    .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
    .addFields(
      { name: "Hosted:", value: `${hosts} Missions`, inline: true },
      { name: "Leeched:", value: `${leeches} Missions`, inline: true },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: "Monthly Ratio", value: `\`${hRatio}%\` — \`${lRatio}%\` !` }
    )
    .setFooter({ text: "Stats reset at the start of every month" });

  await interaction.reply({ embeds: [embed] });
}
