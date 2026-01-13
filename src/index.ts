import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ActivityType,
  EmbedBuilder,
} from "discord.js";
import * as dotenv from "dotenv";
import cron from "node-cron";
import { commands, commandModules } from "./command_list";
import {
  recordMission,
  deleteMissionByMessage,
  getGlobalTotalHosts,
  updateBotReplyId,
  getBotReplyId,
  getMissionByMessageId,
  getUserStats,
} from "./database";
import { checkMilestones } from "./roles";
import { runAutoAlerts } from "./services/auto-alerts";

dotenv.config();

const TOKEN = process.env.BOT_TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const TRACKING_CHANNEL_ID = process.env.TRACKING_CHANNEL_ID as string;
const AUTO_ALERTS_CHANNEL_ID = process.env.ALERT_CHANNEL_ID as string;

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
 * Updates the bot's status with the total global host count.
 */
async function updateBotStatus(client: Client) {
  try {
    const totalHosts = await getGlobalTotalHosts();
    console.log(`[STATUS] Setting activity. Total Global Hosts: ${totalHosts}`);
    client.user?.setActivity({
      name: `Vase Breakers #mission-hosting | ${totalHosts} Total Hosts`,
      type: ActivityType.Listening,
    });
  } catch (error) {
    console.error("❌ Status Error:", error);
  }
}

const commandCollection = new Collection<string, any>();
Object.values(commandModules).forEach((mod: any) => {
  if (mod.data && mod.data.name) commandCollection.set(mod.data.name, mod);
});

const rest = new REST({ version: "10" }).setToken(TOKEN!);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Commands Initialized");
  } catch (e) {
    console.error(e);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandCollection.get(interaction.commandName);
  if (!command) return;
  try {
    console.log(
      `[COMMAND] ${interaction.user.tag} used /${interaction.commandName}`
    );
    await command.execute(interaction);
    if (interaction.commandName === "manage-stats")
      await updateBotStatus(client);
  } catch (error) {
    console.error(error);
  }
});

client.on("messageCreate", async (message) => {
  if (
    message.author.bot ||
    !message.guild ||
    message.channelId !== TRACKING_CHANNEL_ID
  )
    return;

  const userId = message.author.id;
  const content = message.content.toLowerCase().trim();

  // --- HOST TRACKING ---
  if (message.mentions.roles.some((r) => TRACKED_ROLE_IDS.includes(r.id))) {
    try {
      console.log(`[TRACKING] Host detected from ${message.author.tag}`);
      const hostCount = await recordMission(userId, "host", message.id);

      if (message.member) {
        console.log(
          `[ROLES] Checking host milestones for ${message.author.tag} (Count: ${hostCount})`
        );
        const milestoneEmbed = await checkMilestones(
          message.member,
          hostCount,
          "host"
        );

        if (milestoneEmbed) {
          console.log(
            `[ROLES] ${message.author.tag} earned a new Host Milestone role!`
          );
          await message.channel.send({ embeds: [milestoneEmbed] });
        } else if (hostCount > 0 && hostCount % 100 === 0) {
          const centuryEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("🌟 Amazing Contribution!")
            .setDescription(
              `Hey <@${userId}>, you have just hit **${hostCount}** missions hosted! Thank you for your amazing support to the community!`
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
          await message.channel.send({
            content: `<@${userId}>`,
            embeds: [centuryEmbed],
          });
        }
      }

      const reply = await message.reply({
        content: `-# You have now hosted **${hostCount}** missions.`,
        allowedMentions: { repliedUser: false },
      });
      updateBotReplyId(message.id, reply.id);
      await updateBotStatus(client);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  // --- LEECH TRACKING ---
  // Matches: omw, oms, om my way, plus optional x2 or 2x
  const leechRegex = /^(omw|oms|om my way)\s*(x2|2x)?$/;
  const isLeechMatch =
    leechRegex.test(content) ||
    ((content.includes("omw") ||
      content.includes("oms") ||
      content.includes("om my way")) &&
      message.reference);

  if (isLeechMatch) {
    try {
      const iterations =
        content.includes("x2") || content.includes("2x") ? 2 : 1;
      let leechCount = 0;

      console.log(
        `[TRACKING] Leech detected from ${message.author.tag} (Amount: ${iterations})`
      );

      for (let i = 0; i < iterations; i++) {
        leechCount = await recordMission(userId, "leech", message.id);
      }

      if (message.member) {
        console.log(
          `[ROLES] Checking leech milestones for ${message.author.tag} (Count: ${leechCount})`
        );
        const milestoneEmbed = await checkMilestones(
          message.member,
          leechCount,
          "leech"
        );
        if (milestoneEmbed) {
          console.log(
            `[ROLES] ${message.author.tag} earned a new Leech Milestone role!`
          );
          await message.channel.send({ embeds: [milestoneEmbed] });
        }
      }

      const reply = await message.reply({
        content: `-# You have now leeched **${leechCount}** missions.`,
        allowedMentions: { repliedUser: false },
      });
      updateBotReplyId(message.id, reply.id);
      await updateBotStatus(client);
    } catch (err) {
      console.error(err);
    }
  }
});

client.on("messageDelete", async (message) => {
  if (message.channelId !== TRACKING_CHANNEL_ID) return;
  try {
    const mission = await getMissionByMessageId(message.id);
    if (!mission) return;

    console.log(
      `[DELETE] Tracking message deleted! MessageID: ${message.id} | User: ${mission.userId} | Type: ${mission.type}`
    );

    const { userId, type } = mission;
    const botReplyId = await getBotReplyId(message.id);
    const deleted = await deleteMissionByMessage(message.id);

    if (deleted) {
      console.log(`[DELETE] Mission(s) removed from database.`);
      if (botReplyId) {
        const replyMsg = await message.channel.messages
          .fetch(botReplyId)
          .catch(() => null);
        if (replyMsg) {
          console.log(`[DELETE] Removing associated bot reply: ${botReplyId}`);
          await replyMsg.delete();
        }
      }

      const member = await message.guild?.members
        .fetch(userId)
        .catch(() => null);
      if (member) {
        const stats = await getUserStats(userId);
        const newCount = type === "host" ? stats.hosts : stats.leeches;
        console.log(
          `[ROLES] Recalculating milestones for ${member.user.tag} after removal.`
        );
        await checkMilestones(member, newCount, type);
      }
      await updateBotStatus(client);
    }
  } catch (error) {
    console.error("❌ Deletion Error:", error);
  }
});

client.once("ready", async () => {
  console.log(`✅ Bot Online as ${client.user?.tag}`);
  updateBotStatus(client);
  setInterval(() => updateBotStatus(client), 30 * 60 * 1000);

  // --- AUTOMATED MISSION ALERTS (DISABLED) ---
  if (AUTO_ALERTS_CHANNEL_ID) {
    // 1. Run immediately on startup (will skip if already posted/cached)
    console.log("[STARTUP] Checking for mission alerts...");
    runAutoAlerts(client, AUTO_ALERTS_CHANNEL_ID);

    // 2. Schedule for future resets at 00:01 UTC
    cron.schedule(
      "5 0 * * *",
      () => {
        console.log("[SCHEDULE] Triggering daily mission alerts...");
        runAutoAlerts(client, AUTO_ALERTS_CHANNEL_ID);
      },
      {
        timezone: "UTC",
      }
    );
  } else {
    console.error("❌ AUTO_ALERTS_CHANNEL_ID is not defined.");
  }
});

client.login(TOKEN);
