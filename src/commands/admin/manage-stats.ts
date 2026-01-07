import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  GuildTextBasedChannel,
} from "discord.js";
import { db, recordMultipleMissions, getUserStats } from "../../database.js";
import { checkMilestones } from "../../roles.js";
import "dotenv/config";

export const data = new SlashCommandBuilder()
  .setName("manage-stats")
  .setDescription("Admin: Manually add or remove user mission counts")
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
  const admins = process.env.ADMIN_IDS?.split(",") || [];
  if (!admins.includes(interaction.user.id)) {
    return await interaction.reply({
      content: "❌ You do not have permission to use this admin command.",
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const subcommand = interaction.options.getSubcommand();
  const target = interaction.options.getUser("target")!;
  const type = interaction.options.getString("type")! as "host" | "leech";
  const amount = interaction.options.getInteger("amount")!;

  try {
    let finalCount = 0;

    if (subcommand === "add") {
      finalCount = recordMultipleMissions(target.id, type, amount);
    } else if (subcommand === "remove") {
      const deleteStmt = db.prepare(`
        DELETE FROM mission_history 
        WHERE id IN (
          SELECT id FROM mission_history 
          WHERE userId = ? AND type = ? 
          ORDER BY timestamp DESC 
          LIMIT ?
        )
      `);

      const result = deleteStmt.run(target.id, type, amount);
      if (result.changes === 0) {
        return interaction.editReply({
          content: `❌ No **${type}** records found for ${target.username}.`,
        });
      }

      const stats = getUserStats(target.id);
      finalCount = type === "host" ? stats.hosts : stats.leeches;
    }

    // Defensive Member Fetch & Milestone Check
    try {
      const member = await interaction.guild?.members.fetch(target.id);
      if (member) {
        const milestoneEmbed = await checkMilestones(member, finalCount, type);
        if (milestoneEmbed && interaction.channel?.isTextBased()) {
          const textChannel = interaction.channel as GuildTextBasedChannel;
          await textChannel.send({ embeds: [milestoneEmbed] });
        }
      }
    } catch (memberError) {
      console.log(
        `User ${target.id} not in this guild. Database updated, but roles skipped.`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(subcommand === "add" ? 0x00ff00 : 0xff0000)
      .setTitle(`Stats ${subcommand === "add" ? "Increased" : "Decreased"}`)
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
    console.error("Error in manage-stats (SQLite):", error);
    await interaction.editReply({
      content: "❌ An error occurred while updating the database.",
    });
  }
}
