import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  REST,
  Routes,
} from "discord.js";
import { db } from "../../database.js";
import { commands } from "../../command_list.js";
import "dotenv/config";

export const data = new SlashCommandBuilder()
  .setName("sync")
  .setDescription("Refreshes Slash Commands and checks database health");

export async function execute(interaction: ChatInputCommandInteraction) {
  // 1. Manual Admin ID Check from .env
  const admins = process.env.ADMIN_IDS?.split(",") || [];
  if (!admins.includes(interaction.user.id)) {
    return await interaction.reply({
      content: "❌ You do not have permission to use this admin command.",
      flags: [MessageFlags.Ephemeral],
    });
  }

  console.log("1. Sync command triggered by admin...");

  try {
    // Acknowledge using modern MessageFlags
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    console.log("2. Reply deferred.");

    const token = process.env.BOT_TOKEN as string;
    const clientId = process.env.CLIENT_ID as string;

    const rest = new REST({ version: "10" }).setToken(token);

    console.log("3. Starting REST sync...");

    // Ensure command list is valid
    const body = commands.filter((cmd) => cmd !== null && cmd !== undefined);

    console.log(`Found ${body.length} commands. Syncing...`);
    await rest.put(Routes.applicationCommands(clientId), { body: body });
    console.log("4. REST sync complete.");

    // SQLite Health Check: No 'await' needed as better-sqlite3 is sync
    db.prepare("SELECT 1").get();
    console.log("5. Database healthy.");

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("System Sync")
      .addFields(
        {
          name: "Slash Commands",
          value: `✅ Refreshed (${body.length})`,
          inline: true,
        },
        { name: "SQLite DB", value: "✅ Connected", inline: true },
        {
          name: "Bot Latency",
          value: `📡 ${interaction.client.ws.ping}ms`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    console.log("6. Response sent!");
  } catch (error) {
    console.error("!!! SYNC FAILED !!!");
    console.error(error);
    if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ Sync failed. See terminal for details.",
      });
    }
  }
}
