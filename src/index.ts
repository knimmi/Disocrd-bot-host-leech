import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActivityType,
} from "discord.js";
import * as dotenv from "dotenv";
import { commands, commandModules } from "./command_list";
import {
  recordMission,
  deleteMissionByMessage,
  getGlobalTotalHosts,
} from "./database";
import { checkMilestones } from "./roles";

dotenv.config();

const TOKEN = process.env.BOT_TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const TRACKING_CHANNEL_ID = process.env.TRACKING_CHANNEL_ID as string;
const TRACKED_ROLE_IDS = [
  "1457117829340856546",
  "1457117863398605044",
  "1457117897578254518",
  "963751483856281621",
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

/**
 * Updates the bot's Rich Presence status with the global total hosts
 */
async function updateBotStatus(client: Client) {
  try {
    const totalHosts = await getGlobalTotalHosts();
    client.user?.setActivity({
      name: `Vase Breakers #mission-hosting | ${totalHosts} Total Hosts`,
      type: ActivityType.Listening,
    });
    console.log(`📊 Status updated: ${totalHosts} total hosts.`);
  } catch (error) {
    console.error("❌ Failed to update status:", error);
  }
}

const commandCollection = new Collection<string, any>();

Object.values(commandModules).forEach((mod: any) => {
  if (mod.data && mod.data.name) {
    commandCollection.set(mod.data.name, mod);
    console.log(`✅ Loaded command: ${mod.data.name}`);
  } else {
    console.log(`❌ Failed to load a module: Missing 'data.name'`);
  }
});

// Register Slash Commands
const rest = new REST({ version: "10" }).setToken(TOKEN!);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Commands Initialized");
  } catch (e) {
    console.error(e);
  }
})();

// Interaction Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandCollection.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
    if (interaction.commandName === "manage-stats") {
      await updateBotStatus(client);
    }
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: "❌ Error executing command." });
    } else {
      await interaction.reply({
        content: "❌ Error executing command.",
        ephemeral: true,
      });
    }
  }
});

// Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.channelId !== TRACKING_CHANNEL_ID) return;

  const userId = message.author.id;
  const content = message.content.toLowerCase();

  // Track Hosting
  if (message.mentions.roles.some((r) => TRACKED_ROLE_IDS.includes(r.id))) {
    try {
      const hostCount = await recordMission(userId, "host", message.id);
      if (message.member) {
        const milestoneEmbed = await checkMilestones(
          message.member,
          hostCount,
          "host"
        );
        if (milestoneEmbed) {
          await message.channel.send({ embeds: [milestoneEmbed] });
        }
      }

      await message.reply({
        content: `-# You have now hosted **${hostCount}** missions.`,
        allowedMentions: { repliedUser: false },
      });
      await updateBotStatus(client);
    } catch (err) {
      console.error("Error in host tracking:", err);
    }
    return;
  }

  // Track Leeching
  if (content === "omw" || (content.includes("omw") && message.reference)) {
    try {
      const leechCount = await recordMission(userId, "leech", message.id);

      if (message.member) {
        const milestoneEmbed = await checkMilestones(
          message.member,
          leechCount,
          "leech"
        );
        if (milestoneEmbed) {
          await message.channel.send({ embeds: [milestoneEmbed] });
        }
      }

      await message.reply({
        content: `-# You have now leeched **${leechCount}** missions.`,
        allowedMentions: { repliedUser: false },
      });
    } catch (err) {
      console.error("Error in leech tracking:", err);
    }
  }
});

// Message Delete Handler
client.on("messageDelete", async (message) => {
  if (message.channelId === TRACKING_CHANNEL_ID) {
    const deleted = await deleteMissionByMessage(message.id);
    if (deleted) {
      console.log(`🗑️ Removed mission record: ${message.id}`);
      await updateBotStatus(client);
    }
  }
});

client.once("ready", () => {
  console.log(`✅ Bot Online as ${client.user?.tag} (Modular Mode)`);
  updateBotStatus(client);
  setInterval(() => updateBotStatus(client), 30 * 60 * 1000);
});

client.login(TOKEN);
