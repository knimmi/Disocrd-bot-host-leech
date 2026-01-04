import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { getUserStats } from "../database";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Show STW mission stats for a user")
  .addUserOption((opt) =>
    opt.setName("target").setDescription("The user to check")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("target") || interaction.user;
  const { hosts, leeches, total } = await getUserStats(target.id);

  const hRatio = total > 0 ? Math.round((hosts / total) * 100) : 0;
  const lRatio = total > 0 ? Math.round((leeches / total) * 100) : 0;

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`Stats for: ${target.username}`)
    .addFields(
      { name: "Hosted:", value: `${hosts} Missions`, inline: true },
      { name: "Leeched:", value: `${leeches} Missions`, inline: true },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: "Ratio", value: `\`${hRatio}%\` — \`${lRatio}%\` !` }
    );

  await interaction.reply({ embeds: [embed] });
}
