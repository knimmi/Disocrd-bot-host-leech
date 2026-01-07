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
  const { host1k, host3k, leech3k } = MILESTONE_ROLES;

  try {
    if (type === "host") {
      // --- 1. ROLE ASSIGNMENT & REMOVAL ---
      if (count >= 3000) {
        if (!member.roles.cache.has(host3k)) {
          await safelyManageRole(member, host3k, "add");
          if (count === 3000)
            milestoneEmbed = createMilestoneEmbed(
              member,
              "🏆 3,000 Missions Hosted!",
              count,
              type
            );
        }
        if (member.roles.cache.has(host1k))
          await safelyManageRole(member, host1k, "remove");
      } else if (count >= 1000) {
        if (!member.roles.cache.has(host1k)) {
          await safelyManageRole(member, host1k, "add");
          if (count === 1000)
            milestoneEmbed = createMilestoneEmbed(
              member,
              "🏆 1,000 Missions Hosted!",
              count,
              type
            );
        }
        if (member.roles.cache.has(host3k))
          await safelyManageRole(member, host3k, "remove");
      } else {
        // Remove roles if they fall below 1000
        if (member.roles.cache.has(host1k))
          await safelyManageRole(member, host1k, "remove");
        if (member.roles.cache.has(host3k))
          await safelyManageRole(member, host3k, "remove");
      }
    } else if (type === "leech") {
      if (count >= 3000) {
        if (!member.roles.cache.has(leech3k)) {
          await safelyManageRole(member, leech3k, "add");
          if (count === 3000)
            milestoneEmbed = createMilestoneEmbed(
              member,
              "🏆 3,000 Missions Leeched!",
              count,
              type
            );
        }
      } else {
        if (member.roles.cache.has(leech3k))
          await safelyManageRole(member, leech3k, "remove");
      }
    }

    return milestoneEmbed;
  } catch (error) {
    console.error(`Milestone error for ${member.user.tag}:`, error);
    return null;
  }
}

async function safelyManageRole(
  member: GuildMember,
  roleId: string,
  action: "add" | "remove"
) {
  if (!roleId) return;
  const botMember = member.guild.members.me;
  const role = member.guild.roles.cache.get(roleId);

  if (!role || !botMember) return;

  // HIERARCHY CHECK
  if (botMember.roles.highest.position <= role.position) {
    console.warn(
      `⚠️ [Hierarchy Error] Cannot ${action} role "${role.name}". Drag Bot role HIGHER.`
    );
    return;
  }

  try {
    if (action === "add") await member.roles.add(roleId);
    else await member.roles.remove(roleId);
  } catch (e) {
    console.error(`❌ Role ${action} failed:`, e);
  }
}

function createMilestoneEmbed(
  member: GuildMember,
  title: string,
  count: number,
  type: string
) {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(title)
    .setDescription(
      `Congratulations ${
        member.user.username
      }! You have reached the ${count.toLocaleString()} ${type} milestone.`
    )
    .setThumbnail(member.user.displayAvatarURL())
    .addFields({ name: "New Total", value: `\`${count}\`` })
    .setTimestamp();
}
