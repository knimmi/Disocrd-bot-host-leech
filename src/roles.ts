import { GuildMember, EmbedBuilder } from "discord.js";

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
  let roleId = "";
  let title = "";
  let description = "";

  if (type === "host") {
    if (count >= 1000 && count < 3000) {
      roleId = MILESTONE_ROLES.host1k;
      title = "🎊 1,000 Missions Hosted!";
      description = `Congratulations ${member.user.username}! You have hosted 1,000 missions.`;
    } else if (count >= 3000) {
      roleId = MILESTONE_ROLES.host3k;
      title = "🏆 3,000 Missions Hosted!";
      description = `Congratulations ${member.user.username}! You have hosted 3,000 missions.`;
    }
  } else if (type === "leech" && count >= 3000) {
    roleId = MILESTONE_ROLES.leech3k;
    title = "🚀 3,000 Missions Leeched!";
    description = `Congratulations ${member.user.username}! You have leeched 3,000 missions!`;
  }

  // ONLY proceed if a role was identified AND the member does not already have it
  if (roleId && !member.roles.cache.has(roleId)) {
    try {
      await member.roles.add(roleId);
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields({ name: "Total Missions", value: `\`${count}\` ${type}s` })
        .setTimestamp();

      return embed;
    } catch (error) {
      console.error(
        `Failed to add role ${roleId} to ${member.user.tag}:`,
        error
      );
    }
  }

  return null;
}
