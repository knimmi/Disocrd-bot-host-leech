import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  REST,
  Routes,
} from "discord.js";
import { pool } from "../../database";
import { commands } from "../../command_list";

export const data = new SlashCommandBuilder()
  .setName("sync")
  .setDescription("Refreshes Slash Commands and checks database health")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // Restricted to Admins

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log("1. Command triggered...");

  try {
    await interaction.deferReply({ ephemeral: true });
    console.log("2. Reply deferred.");

    const token = process.env.BOT_TOKEN as string;
    const clientId = process.env.CLIENT_ID as string;

    const rest = new REST({ version: "10" }).setToken(token);

    console.log("3. Starting REST sync...");

    // FIX: Your commands list already contains JSON objects.
    // We just need to ensure they are valid objects.
    const body = commands.filter((cmd) => {
      if (!cmd) {
        console.log("⚠️ Found a null/undefined entry in command_list.");
        return false;
      }
      return true;
    });

    console.log(`Found ${body.length} commands in the list. Syncing...`);

    await rest.put(Routes.applicationCommands(clientId), { body: body });

    console.log("4. REST sync complete.");
    await pool.query("SELECT 1");
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
        { name: "Database Pool", value: "✅ Connected", inline: true },
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
        content: "Sync failed. See terminal for details.",
      });
    }
  }
}
