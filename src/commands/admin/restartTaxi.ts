import { exec } from "child_process";
import {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

const OWNER_ID = "767333937919557633";

// Added 'data' export so your loader and sync command can read it
export const data = new SlashCommandBuilder()
  .setName("restarttaxi")
  .setDescription("Restarts the Fortnite Taxi bot (Owner Only)")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const restartTaxi = {
  data, // Link the builder to your object
  async execute(interaction: any) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: "❌ Only the bot owner can use this command.",
        flags: [MessageFlags.Ephemeral], // Fixed the ephemeral warning
      });
    }

    await interaction.reply("🔄 Restarting taxi-bot on the VPS...");

    exec("pm2 restart taxi-bot", (error, stdout) => {
      if (error) {
        return interaction.editReply("❌ Failed to restart. Is PM2 running?");
      }
      interaction.editReply("✅ Taxi bot successfully restarted!");
    });
  },
};
