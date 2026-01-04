import { GuildMember, EmbedBuilder } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const MILESTONE_ROLES = {
  host1k: process.env.ROLE_HOST_1K as string,
  host3k: process.env.ROLE_HOST_3K as string,
  leech3k: process.env.ROLE_LEECH_3K as string,
};

export async function checkMilestones(
  member: GuildMember,
  count: number,
  type: "host" | "leech"
) {
  let milestoneEmbed: EmbedBuilder | null = null;
  const host1k = MILESTONE_ROLES.host1k;
  const host3k = MILESTONE_ROLES.host3k;

  try {
    if (type === "host") {
      // --- 1. ROLE SYNCING LOGIC ---
      if (count >= 3000) {
        if (!member.roles.cache.has(host3k)) {
          await member.roles.add(host3k);
          milestoneEmbed = createMilestoneEmbed(
            member,
            "🏆 3,000 Missions Hosted!",
            `Congratulations ${member.user.username}! You have reached the 3,000 host milestone.`,
            count,
            type
          );
        }
        if (member.roles.cache.has(host1k)) await member.roles.remove(host1k);
      } else if (count >= 1000) {
        if (!member.roles.cache.has(host1k)) {
          await member.roles.add(host1k);
          milestoneEmbed = createMilestoneEmbed(
            member,
            "🎊 1,000 Missions Hosted!",
            `Congratulations ${member.user.username}! You have reached the 1,000 host milestone.`,
            count,
            type
          );
        }
        if (member.roles.cache.has(host3k)) await member.roles.remove(host3k);
      } else {
        if (member.roles.cache.has(host1k)) await member.roles.remove(host1k);
        if (member.roles.cache.has(host3k)) await member.roles.remove(host3k);
      }

      // --- 2. EVERY 100 HOSTS LOGIC ---
      // This checks if the count is a multiple of 100 (e.g., 3100, 3200)
      // and ensures we don't overwrite a major milestone embed (1k/3k)
      if (count > 0 && count % 100 === 0 && !milestoneEmbed) {
        milestoneEmbed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle("🌟 Amazing Contribution!")
          .setDescription(
            `Hey ${member}, you have hosted **${count}** missions now. Thank you for your amazing contribution to the server!`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();
      }
    } else if (type === "leech") {
      const leech3k = MILESTONE_ROLES.leech3k;
      if (count >= 3000) {
        if (!member.roles.cache.has(leech3k)) {
          await member.roles.add(leech3k);
          milestoneEmbed = createMilestoneEmbed(
            member,
            "🚀 3,000 Missions Leeched!",
            `Congratulations ${member.user.username}! You have reached the 3,000 leech milestone.`,
            count,
            type
          );
        }
      } else {
        if (member.roles.cache.has(leech3k)) await member.roles.remove(leech3k);
      }
    }

    return milestoneEmbed;
  } catch (error) {
    console.error(`Milestone error for ${member.user.tag}:`, error);
    return null;
  }
}

function createMilestoneEmbed(
  member: GuildMember,
  title: string,
  description: string,
  count: number,
  type: string
) {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields({ name: "New Total", value: `\`${count}\` ${type}s` })
    .setTimestamp();
}
