import { Message, EmbedBuilder } from "discord.js";
// We import the same database functions your slash commands use
import {
  getUserStats,
  getLeaderboard,
  getGlobalTotalHosts,
  getUserMonthlyStats,
} from "./database";

const PREFIX = ".";

export const handlePrefixCommand = async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  // Split command and args
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  // Helper to get target user (Mention or Author)
  const getTarget = () => message.mentions.users.first() || message.author;

  try {
    switch (commandName) {
      // --- .host [@user] ---
      case "host": {
        const target = getTarget();
        const { hosts, leeches, total } = await getUserStats(target.id);

        const hRatio = total > 0 ? Math.round((hosts / total) * 100) : 0;
        const lRatio = total > 0 ? Math.round((leeches / total) * 100) : 0;

        const embed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle(`Stats for: ${target.username}`)
          .addFields(
            { name: "Hosted:", value: `${hosts} Missions`, inline: true },
            { name: "Leeched:", value: `${leeches} Missions`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true },
            { name: "Ratio", value: `\`${hRatio}%\` — \`${lRatio}%\` !` }
          );

        await message.reply({
          embeds: [embed],
          allowedMentions: { repliedUser: false },
        });
        break;
      }

      // --- .lb ---
      case "lb": {
        const totalGlobal = getGlobalTotalHosts();
        const rows = getLeaderboard(0) as any[]; // 0 for all-time

        const lbText =
          rows.length > 0
            ? rows
                .map(
                  (row, i) =>
                    `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
                )
                .join("\n")
            : "No data yet.";

        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle("🏆 Global Mission Leaderboard")
          .setDescription(
            `A total of **${totalGlobal}** missions have been hosted!`
          )
          .addFields({ name: "Top 10 Mission Hosts", value: lbText })
          .setTimestamp();

        await message.reply({
          embeds: [embed],
          allowedMentions: { repliedUser: false },
        });
        break;
      }

      // --- .mlb ---
      case "mlb": {
        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).getTime();
        const rows = getLeaderboard(startOfMonth) as any[];

        const lbText =
          rows.length > 0
            ? rows
                .map(
                  (row, i) =>
                    `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
                )
                .join("\n")
            : "No missions hosted this month yet!";

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(
            `🏆 Top Hosts - ${now.toLocaleString("en-US", { month: "long" })}`
          )
          .setDescription(lbText)
          .setTimestamp();

        await message.reply({
          embeds: [embed],
          allowedMentions: { repliedUser: false },
        });
        break;
      }

      // --- .mhost [@user] ---
      case "mhost": {
        const target = getTarget();
        const { hosts, leeches, total } = await getUserMonthlyStats(target.id);

        const hRatio = total > 0 ? Math.round((hosts / total) * 100) : 0;
        const lRatio = total > 0 ? Math.round((leeches / total) * 100) : 0;

        const currentMonthName = new Date().toLocaleString("default", {
          month: "long",
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`Monthly Stats: ${currentMonthName}`)
          .setAuthor({
            name: target.username,
            iconURL: target.displayAvatarURL(),
          })
          .addFields(
            { name: "Hosted:", value: `${hosts} Missions`, inline: true },
            { name: "Leeched:", value: `${leeches} Missions`, inline: true },
            { name: "\u200B", value: "\u200B", inline: true },
            {
              name: "Monthly Ratio",
              value: `\`${hRatio}%\` — \`${lRatio}%\` !`,
            }
          )
          .setFooter({ text: "Stats reset at the start of every month" });

        await message.reply({
          embeds: [embed],
          allowedMentions: { repliedUser: false },
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Error executing prefix command ${commandName}:`, error);
    await message.reply({
      content: "There was an error trying to execute that command.",
      allowedMentions: { repliedUser: false },
    });
  }
};
