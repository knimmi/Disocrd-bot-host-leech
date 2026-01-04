import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { pool, recordMission } from "../../database.js";
import { checkMilestones } from "../../roles.js";

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
  const subcommand = interaction.options.getSubcommand();
  const target = interaction.options.getUser("target")!;
  const type = interaction.options.getString("type")! as "host" | "leech";
  const amount = interaction.options.getInteger("amount")!;

  if (subcommand === "add") {
    let finalCount = 0;

    // Use recordMission in a loop to ensure milestones trigger correctly
    for (let i = 0; i < amount; i++) {
      finalCount = await recordMission(target.id, type);
    }

    // Check milestones for the member
    const member = await interaction.guild?.members.fetch(target.id);
    if (member) {
      const milestoneEmbed = await checkMilestones(member, finalCount, type);
      if (milestoneEmbed && interaction.channel?.isTextBased()) {
        await (interaction.channel as any).send({ embeds: [milestoneEmbed] });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Stats Updated")
      .setDescription(
        `Successfully **added** \`${amount}\` **${type}** to ${target.username}.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (subcommand === "remove") {
    const [result] = (await pool.execute(
      "DELETE FROM mission_history WHERE userId = ? AND type = ? ORDER BY timestamp DESC LIMIT ?",
      [target.id, type, amount]
    )) as any;

    const deletedCount = result.affectedRows;

    if (deletedCount === 0) {
      return interaction.reply({
        content: `❌ No **${type}** found for ${target.username}.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Stats Updated")
      .setDescription(
        `Successfully **removed** \`${deletedCount}\` **${type}** from ${target.username}.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
