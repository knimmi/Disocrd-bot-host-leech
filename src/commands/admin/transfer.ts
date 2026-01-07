import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { db, getUserStats } from "../../database.js";
import { checkMilestones } from "../../roles.js";
import "dotenv/config";

export const data = new SlashCommandBuilder()
  .setName("transfer")
  .setDescription("Admin: Transfer all stats from one user to another")
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
  // 1. Manual Admin ID Check from .env
  const admins = process.env.ADMIN_IDS?.split(",") || [];
  if (!admins.includes(interaction.user.id)) {
    return await interaction.reply({
      content: "❌ You do not have permission to use this admin command.",
      flags: [MessageFlags.Ephemeral],
    });
  }

  const fromUser = interaction.options.getUser("from")!;
  const toUser = interaction.options.getUser("to")!;

  // Prevent transferring to the same account
  if (fromUser.id === toUser.id) {
    return interaction.reply({
      content: "❌ You cannot transfer stats to the same user.",
      flags: [MessageFlags.Ephemeral],
    });
  }

  // Acknowledge using modern MessageFlags
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  try {
    // 2. SQLite Update
    const stmt = db.prepare(
      "UPDATE mission_history SET userId = ? WHERE userId = ?"
    );
    const result = stmt.run(toUser.id, fromUser.id);
    const transferredCount = result.changes;

    if (transferredCount === 0) {
      return interaction.editReply(
        `❌ No mission records were found for **${fromUser.username}**.`
      );
    }

    // 3. Defensive Member Fetch (Fixes Unknown Member error)
    try {
      const targetMember = await interaction.guild?.members.fetch(toUser.id);
      if (targetMember) {
        const stats = getUserStats(toUser.id);

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

        if (interaction.channel?.isSendable()) {
          if (hostEmbed)
            await interaction.channel.send({ embeds: [hostEmbed] });
          if (leechEmbed)
            await interaction.channel.send({ embeds: [leechEmbed] });
        }
      }
    } catch (memberError) {
      console.log(`Target user ${toUser.id} not in this guild. Roles skipped.`);
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
          value: `${toUser.username} (\`${toUser.id}\`)`,
          inline: true,
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
