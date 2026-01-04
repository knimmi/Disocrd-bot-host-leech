import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { pool, recordMultipleMissions, getUserStats } from "../../database";
import { checkMilestones } from "../../roles";

export const data = new SlashCommandBuilder()
  .setName("manage-stats")
  .setDescription("Admin: Manually add or remove user mission counts")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add stat records to a user")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("The user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Host or Leech")
          .setRequired(true)
          .addChoices(
            { name: "Host", value: "host" },
            { name: "Leech", value: "leech" }
          )
      )
      .addIntegerOption((opt) =>
        opt
          .setName("amount")
          .setDescription("Number of records to add")
          .setMinValue(1)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove stats from a user")
      .addUserOption((opt) =>
        opt.setName("target").setDescription("The user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("type")
          .setDescription("Host or Leech")
          .setRequired(true)
          .addChoices(
            { name: "Host", value: "host" },
            { name: "Leech", value: "leech" }
          )
      )
      .addIntegerOption((opt) =>
        opt
          .setName("amount")
          .setDescription("Number of records to remove")
          .setMinValue(1)
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  // 1. Immediately acknowledge the command to prevent the 3-second timeout error
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();
  const target = interaction.options.getUser("target")!;
  const type = interaction.options.getString("type")! as "host" | "leech";
  const amount = interaction.options.getInteger("amount")!;

  try {
    let finalCount = 0;

    if (subcommand === "add") {
      // Use the bulk insertion function for speed
      finalCount = await recordMultipleMissions(target.id, type, amount);
    } else if (subcommand === "remove") {
      // Delete the most recent records up to the specified amount
      await pool.execute(
        "DELETE FROM mission_history WHERE userId = ? AND type = ? ORDER BY timestamp DESC LIMIT ?",
        [target.id, type, amount]
      );

      // Fetch the updated total after the records are deleted
      const stats = await getUserStats(target.id);
      finalCount = type === "host" ? stats.hosts : stats.leeches;
    }

    // 2. Sync Roles (This now handles both Adding and Stripping roles)
    const member = await interaction.guild?.members.fetch(target.id);
    if (member) {
      const milestoneEmbed = await checkMilestones(member, finalCount, type);

      // Only send the congratulatory message if they actually gained a NEW role
      if (
        milestoneEmbed &&
        interaction.channel &&
        "send" in interaction.channel
      ) {
        await (interaction.channel as any).send({ embeds: [milestoneEmbed] });
      }
    }

    // 3. Send the confirmation embed to the Admin
    const embed = new EmbedBuilder()
      .setColor(subcommand === "add" ? 0x00ff00 : 0xff0000)
      .setTitle(`📈 Stats ${subcommand === "add" ? "Updated" : "Reduced"}`)
      .setDescription(
        `Successfully updated stats for **${target.username}**.\n\n` +
          `**Action:** ${
            subcommand === "add" ? "Added" : "Removed"
          } \`${amount}\` ${type}(s)\n` +
          `**New Total:** \`${finalCount}\``
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in manage-stats command:", error);
    await interaction.editReply({
      content: "❌ An error occurred while updating the database or roles.",
    });
  }
}
