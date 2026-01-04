import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { pool, getUserStats } from "../../database";
import { checkMilestones } from "../../roles";

export const data = new SlashCommandBuilder()
  .setName("transfer")
  .setDescription("Admin: Transfer all stats from one user to another")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((opt) =>
    opt
      .setName("from")
      .setDescription("The user to take stats FROM")
      .setRequired(true)
  )
  .addUserOption((opt) =>
    opt
      .setName("to")
      .setDescription("The user to give stats TO")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const fromUser = interaction.options.getUser("from")!;
  const toUser = interaction.options.getUser("to")!;

  // Prevent transferring to the same account
  if (fromUser.id === toUser.id) {
    return interaction.reply({
      content: "❌ You cannot transfer stats to the same user.",
      ephemeral: true,
    });
  }
  await interaction.deferReply({ ephemeral: true });
  try {
    const [result] = (await pool.execute(
      "UPDATE mission_history SET userId = ? WHERE userId = ?",
      [toUser.id, fromUser.id]
    )) as any;

    const transferredCount = result.affectedRows;

    if (transferredCount === 0) {
      return interaction.editReply(
        `❌ No mission records were found for **${fromUser.username}**.`
      );
    }

    // Check milestones for the recipient
    const targetMember = await interaction.guild?.members.fetch(toUser.id);
    if (targetMember) {
      const stats = await getUserStats(toUser.id);

      // Check both host and leech milestones for the new user
      const hostEmbed = await checkMilestones(
        targetMember,
        stats.hosts,
        "host"
      );
      const leechEmbed = await checkMilestones(
        targetMember,
        stats.leeches,
        "leech"
      );

      // Send celebration embeds if they reached a new milestone
      if (interaction.channel?.isSendable()) {
        if (hostEmbed) await interaction.channel.send({ embeds: [hostEmbed] });
        if (leechEmbed)
          await interaction.channel.send({ embeds: [leechEmbed] });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Stats Transfer Complete")
      .setDescription(`Successfully reassigned \`${transferredCount}\` stats.`)
      .addFields(
        {
          name: "Source:",
          value: `${fromUser.username} (\`${fromUser.id}\`)`,
          inline: true,
        },
        {
          name: "Destination:",
          inline: true,
          value: `${toUser.username} (\`${toUser.id}\`)`,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Transfer Error:", error);
    await interaction.editReply(
      "❌ A database error occurred during the transfer."
    );
  }
}
