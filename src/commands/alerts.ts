import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import fs from "fs";
import path from "path";
import { THEATER_MAP, ZONE_ORDER } from "../utils/maps.js";
import {
  getPowerLevel,
  resolveMissionType,
  resolveZone,
} from "../utils/zone-utils.js";
import {
  checkRewardMatch,
  is160Mission,
  aggregateRewards,
} from "../utils/filters.js";

import { resolveItem, getMissionEmoji } from "../utils/itemUtils.js";

const REWARD_CHOICES = [
  { name: "V-Bucks", value: "currency_mtxswap" },
  { name: "Mythic Leads", value: "filter_mythic_lead" },
  { name: "Upgrade Llama Tokens", value: "voucher_cardpack_bronze" },
  { name: "Mini Llamas", value: "voucher_basicpack" },
  { name: "Masters Driver", value: "sid_blunt_club_light" },
  { name: "Fortsville Slugger 3000", value: "sid_blunt_light_rocketbat" },
  { name: "Power B.A.S.E. Knox", value: "hid_constructor_008" },
  { name: "Legendary Survivor", value: "workerbasic_sr_t0" },
  { name: "Legendary Schematics", value: "filter_leg_schematic" },
  { name: "Legendary Heroes", value: "filter_leg_hero" },
  { name: "Fire-Up", value: "reagent_alteration_ele_fire" },
  { name: "Frost-Up", value: "reagent_alteration_ele_water" },
  { name: "Amp-Up", value: "reagent_alteration_ele_nature" },
  { name: "160s", value: "filter_160" },
];

export const data = new SlashCommandBuilder()
  .setName("alerts")
  .setDescription("Scan STW mission alerts for specific rewards")
  .addStringOption((o) =>
    o
      .setName("reward")
      .setDescription("The reward to search for")
      .setRequired(true)
      .addChoices(...REWARD_CHOICES)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();
    const cachePath = path.join(process.cwd(), "src", "daily_missions.json");

    if (!fs.existsSync(cachePath)) {
      return await interaction.editReply("❌ Mission data unavailable.");
    }

    const worldData = JSON.parse(fs.readFileSync(cachePath, "utf8"));

    const missionLookup = new Map();
    worldData.missions.forEach((t: any) =>
      t.availableMissions.forEach((m: any) =>
        missionLookup.set(`${t.theaterId}-${m.tileIndex}`, m)
      )
    );

    const selectedReward = interaction.options.getString("reward") || "";
    const rewardDisplayName =
      REWARD_CHOICES.find((c) => c.value === selectedReward)?.name || "Rewards";

    // Format time for footer "Today at HH:MM"
    const timeString = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const footerText = ` • Today at ${timeString}`;

    // { line: string, value: number } used for sorting
    const groupedResults: Record<string, { line: string; value: number }[]> =
      {};
    let totalCount = 0;

    // --- MAIN LOOP ---
    worldData.missionAlerts.forEach((tGroup: any) => {
      const theaterId = tGroup.theaterId;

      tGroup.availableMissionAlerts?.forEach((alert: any) => {
        const mInfo = missionLookup.get(`${theaterId}-${alert.tileIndex}`);
        if (!mInfo) return;

        const plNum = getPowerLevel(
          theaterId,
          mInfo.missionDifficultyInfo?.rowName || ""
        );
        const pl = plNum > 0 ? plNum.toString() : "??";

        const alertItems = alert.missionAlertRewards?.items || [];
        let isMatch = false;
        let displayRewardsText = "";
        let sortValue = 0;

        // CASE 1: 160 Zones
        if (selectedReward === "filter_160") {
          if (is160Mission(pl)) {
            isMatch = true;

            // 1. Grab Base Rewards ONLY
            const rawRewards = mInfo.missionRewards?.items || [];

            // 2. Filter Logic: REMOVE GOLD ONLY
            const filtered = rawRewards.filter((i: any) => {
              const type = i.itemType.toLowerCase();
              return (
                !type.includes("eventcurrency") &&
                !type.includes("eventscaling") &&
                !type.includes("currency_scaling")
              );
            });

            // Calculate Sort Value (Sum of quantities)
            sortValue = filtered.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            );

            // 3. Aggregate
            const aggregated = aggregateRewards(filtered);

            // 4. Generate Text
            if (aggregated.length > 0) {
              displayRewardsText = aggregated
                .map((i: any) => {
                  const item = resolveItem(i.itemType);
                  // Format: "5x 🦀" (NO NAMES)
                  return `**${i.quantity}x** ${item.emoji}`;
                })
                .join(", ");
            } else {
              displayRewardsText = "*(No Non-Gold Rewards)*";
            }
          }
        }
        // CASE 2: Specific Item Search
        else {
          isMatch = alertItems.some((i: any) =>
            checkRewardMatch(i.itemType, selectedReward)
          );

          if (isMatch) {
            const specificItems = alertItems.filter((i: any) =>
              checkRewardMatch(i.itemType, selectedReward)
            );

            const currentTotal = specificItems.reduce(
              (acc: number, i: any) => acc + i.quantity,
              0
            );
            totalCount += currentTotal;
            sortValue = currentTotal;

            displayRewardsText = alertItems
              .map((i: any) => {
                const item = resolveItem(i.itemType);
                const isTarget = checkRewardMatch(i.itemType, selectedReward);
                // Bold quantity only if it matches the search
                const quantityStr = isTarget
                  ? `**${i.quantity}x**`
                  : `${i.quantity}x`;
                // Format: "10x 🎟️" (NO NAMES)
                return `${quantityStr} ${item.emoji}`;
              })
              .join(", ");
          }
        }

        if (isMatch) {
          const zone = resolveZone(theaterId);
          if (!groupedResults[zone]) groupedResults[zone] = [];

          const missionName = resolveMissionType(mInfo.missionGenerator);

          // --- MISSION ICON LOGIC ---
          let missionIcon = getMissionEmoji(missionName);

          // OVERRIDE: Check if the alert name matches the MSK ID
          if (alert.name === "MissionAlert_DudebroCategory_03") {
            // Force MSK Emoji
            missionIcon = getMissionEmoji("Mythic Storm King");
          }

          groupedResults[zone].push({
            // REMOVED ${missionName}. Layout: Icon ⚡ PL | Rewards
            line: `${missionIcon} ⚡ \`${pl}\` | ${displayRewardsText}`,
            value: sortValue,
          });
        }
      });
    });

    // --- SORTING ZONES ---
    const sortedZones = Object.keys(groupedResults).sort(
      (a, b) =>
        ZONE_ORDER.indexOf(
          Object.keys(THEATER_MAP).find((k) => THEATER_MAP[k] === a)!
        ) -
        ZONE_ORDER.indexOf(
          Object.keys(THEATER_MAP).find((k) => THEATER_MAP[k] === b)!
        )
    );

    // --- EMPTY STATE ---
    if (sortedZones.length === 0) {
      const noMissionsEmbed = new EmbedBuilder()
        .setTitle(`STW Alerts For: ${rewardDisplayName}`)
        .setColor("#FF0000")
        .setDescription(
          `❌ No missions found for **${rewardDisplayName}**.\nBetter luck next reset!`
        )
        .setFooter({ text: footerText })
        .setTimestamp();

      return await interaction.editReply({ embeds: [noMissionsEmbed] });
    }

    // --- PAGINATION ---
    const pages: string[] = [];
    let currentPageContent = "";
    const MAX_MISSIONS_PER_ZONE = 20;
    const MAX_CHARS_PER_PAGE = 3800;

    for (const zone of sortedZones) {
      // SORT BY VALUE DESCENDING
      const rawMissions = groupedResults[zone];
      rawMissions.sort((a, b) => b.value - a.value);

      let missions = rawMissions.map((x) => x.line);
      const zoneHeader = `**${zone.toUpperCase()}**`;

      if (missions.length > MAX_MISSIONS_PER_ZONE) {
        const remaining = missions.length - MAX_MISSIONS_PER_ZONE;
        missions = missions.slice(0, MAX_MISSIONS_PER_ZONE);
        missions.push(`*...and ${remaining} more hidden.*`);
      }

      const zoneMissions = missions.join("\n");
      const zoneBlock = `${zoneHeader}\n${zoneMissions}\n\n`;

      if (currentPageContent.length + zoneBlock.length > MAX_CHARS_PER_PAGE) {
        if (currentPageContent.length > 0) {
          pages.push(currentPageContent);
          currentPageContent = "";
        }
        if (zoneBlock.length > MAX_CHARS_PER_PAGE) {
          const safeBlock =
            zoneBlock.substring(0, MAX_CHARS_PER_PAGE - 100) +
            "\n...(Truncated)";
          pages.push(safeBlock);
        } else {
          currentPageContent = zoneBlock;
        }
      } else {
        currentPageContent += zoneBlock;
      }
    }

    if (currentPageContent.length > 0) {
      pages.push(currentPageContent);
    }

    const generateEmbed = (pageIndex: number) => {
      return new EmbedBuilder()
        .setTitle(`STW Alerts For: ${rewardDisplayName}`)
        .setColor("#5865F2")
        .setDescription(pages[pageIndex])
        .setFooter({
          text: `Total Items: ${formatNumber(totalCount)}${footerText}`,
        });
    };

    if (pages.length === 1) {
      return await interaction.editReply({
        embeds: [generateEmbed(0)],
        components: [],
      });
    }

    let currentPage = 0;
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ➡️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false)
    );

    const res = await interaction.editReply({
      embeds: [generateEmbed(0)],
      components: [row],
    });

    const collector = res.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) return;

      if (i.customId === "next") currentPage++;
      else currentPage--;

      const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === pages.length - 1)
      );

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [updatedRow],
      });
    });
  } catch (e) {
    console.error(e);
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString("nl-NL");
}
