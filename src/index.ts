import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import * as dotenv from "dotenv";
import { commands, commandModules } from "./command_list.js";
import { recordMission } from "./database.js";
import { checkMilestones } from "./roles.js";

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
  ],
});

const commandCollection = new Collection<string, any>();
Object.values(commandModules).forEach((mod) => {
  commandCollection.set(mod.data.name, mod);
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
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "❌ Error executing command.",
      ephemeral: true,
    });
  }
});

// Message Handler
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  // Only track in the specified channel
  if (message.channelId !== TRACKING_CHANNEL_ID) return;
  const userId = message.author.id;
  const content = message.content.toLowerCase();
  // Track Hosting
  if (message.mentions.roles.some((r) => TRACKED_ROLE_IDS.includes(r.id))) {
    const hostCount = await recordMission(userId, "host");
    // Check for hosting milestones
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
    return;
  }

  // Track Leeching
  if (content === "omw" || (content.includes("omw") && message.reference)) {
    const leechCount = await recordMission(userId, "leech");
    // Check for leeching milestones
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
  }
});

client.once("ready", () => {
  console.log(`✅ Bot Online as ${client.user?.tag} (Modular Mode)`);
});

client.login(TOKEN);
