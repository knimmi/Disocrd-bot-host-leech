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

async function updateBotStatus(client: Client) {
  try {
    const totalHosts = await getGlobalTotalHosts();
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
  const content = message.content.toLowerCase();

  // --- HOST TRACKING ---
  if (message.mentions.roles.some((r) => TRACKED_ROLE_IDS.includes(r.id))) {
    try {
      const hostCount = await recordMission(userId, "host", message.id);

      if (message.member) {
        // Check for 1k/3k Role Milestone
        const milestoneEmbed = await checkMilestones(
          message.member,
          hostCount,
          "host"
        );

        if (milestoneEmbed) {
          await message.channel.send({ embeds: [milestoneEmbed] });
        }
        // Only send Century message if NO major milestone triggered and it's exactly a multiple of 100
        else if (hostCount > 0 && hostCount % 100 === 0) {
          const centuryEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle("🌟 Amazing Contribution!")
            .setDescription(
              `Hey <@${userId}>, you have just hit **${hostCount}** missions hosted! Thank you!`
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
  if (content === "omw" || (content.includes("omw") && message.reference)) {
    try {
      const leechCount = await recordMission(userId, "leech", message.id);
      if (message.member) {
        const milestoneEmbed = await checkMilestones(
          message.member,
          leechCount,
          "leech"
        );
        if (milestoneEmbed)
          await message.channel.send({ embeds: [milestoneEmbed] });
      }
      const reply = await message.reply({
        content: `-# You have now leeched **${leechCount}** missions.`,
        allowedMentions: { repliedUser: false },
      });
      updateBotReplyId(message.id, reply.id);
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

    const { userId, type } = mission;
    const botReplyId = await getBotReplyId(message.id);
    const deleted = await deleteMissionByMessage(message.id);

    if (deleted) {
      if (botReplyId) {
        const replyMsg = await message.channel.messages
          .fetch(botReplyId)
          .catch(() => null);
        if (replyMsg) await replyMsg.delete();
      }

      const member = await message.guild?.members
        .fetch(userId)
        .catch(() => null);
      if (member) {
        const stats = await getUserStats(userId);
        const newCount = type === "host" ? stats.hosts : stats.leeches;
        await checkMilestones(member, newCount, type);
      }
      await updateBotStatus(client);
    }
  } catch (error) {
    console.error(error);
  }
});

client.once("clientReady", async () => {
  console.log(`✅ Bot Online as ${client.user?.tag}`);
  updateBotStatus(client);
  setInterval(() => updateBotStatus(client), 30 * 60 * 1000);
});

client.login(TOKEN);
