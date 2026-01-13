import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { forceSyncMissions } from "../../utils/sync-utils.js";
import { runAutoAlerts } from "../../services/auto-alerts.js";
import "dotenv/config";

export const data = new SlashCommandBuilder()
  .setName("refresh")
  .setDescription("Admin ONLY: Force a manual refresh of STW mission data")
  .addBooleanOption((option) =>
    option
      .setName("resend_feeds")
      .setDescription(
        "Should the bot resend the mission alerts to the channel?"
      )
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const adminIds = process.env.ADMIN_IDS?.split(",") || [];

  if (!adminIds.includes(interaction.user.id)) {
    return await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            "❌ **Access Denied:** You are not authorized to use this command."
          ),
      ],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await forceSyncMissions();
    const embed = new EmbedBuilder().setTimestamp();

    if (result.success) {
      const resend = interaction.options.getBoolean("resend_feeds");
      let statusDescription = "✅ **Mission data refreshed successfully.**";

      if (resend) {
        const channelId = process.env.ALERT_CHANNEL_ID;
        if (!channelId) {
          statusDescription +=
            "\n⚠️ Feeds not sent: `ALERT_CHANNEL_ID` missing in .env.";
        } else {
          // Pass 'true' to bypass the 24h cooldown check if needed
          await runAutoAlerts(interaction.client, channelId, true);
          statusDescription += `\n📤 **Feeds Resent:** Alerts posted to <#${channelId}>.`;
        }
      }

      embed
        .setTitle("System Update")
        .setDescription(statusDescription)
        .setColor(0x43b581); // Green
    } else {
      embed
        .setTitle("Update Failed")
        .setDescription(`❌ Sync error: \`${result.error}\``)
        .setColor(0xf04747); // Red
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("Refresh Command Error:", error);
    const errorEmbed = new EmbedBuilder()
      .setTitle("System Error")
      .setDescription("❌ An unexpected error occurred during execution.")
      .setColor(0xf04747);

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
