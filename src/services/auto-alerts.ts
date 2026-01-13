import { Client, TextChannel, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { forceSyncMissions } from "../utils/sync-utils.js";
import { resolveItem, getMissionEmoji } from "../utils/itemUtils.js";
import {
  is160Mission,
  aggregateRewards,
  checkRewardMatch,
} from "../utils/filters.js";
import { THEATER_MAP, ZONE_ORDER } from "../utils/maps.js";
import {
  getPowerLevel,
  resolveMissionType,
  resolveZone,
} from "../utils/zone-utils.js";

const CACHE_PATH = path.join(process.cwd(), "src", "daily_missions.json");
const HASH_FILE_PATH = path.join(process.cwd(), "src", "last_alert_hash.txt");

// --- CONFIGURATION ---
const ALERT_CATEGORIES = [
  {
    name: "V-Bucks",
    filter: "currency_mtxswap",
    color: 0x00bcf3,
  },
  {
    name: "Mythic Leads",
    filter: "filter_mythic_lead",
    color: 0xffd700,
    emoji: "👑",
  },
  {
    name: "Upgrade Llama Tokens",
    filter: "voucher_cardpack_bronze",
    color: 0xa0522d,
  },
  {
    name: "Power B.A.S.E. Knox",
    filter: "hid_constructor_008",
    color: 0xffa500,
  },
  {
    name: "Masters Driver",
    filter: "sid_blunt_club_light",
    color: 0x9b59b6,
  },
  {
    name: "Fortsville Slugger 3000",
    filter: "sid_blunt_light_rocketbat",
    color: 0x9b59b6,
    emoji: "<:slugger:1457711578404098089>",
  },
  {
    name: "160 Zones",
    filter: "filter_160",
    color: 0xff0000,
    emoji: "⚡",
  },
];

function getFileHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

export async function runAutoAlerts(
  client: Client,
  channelId: string,
  force: boolean = false
) {
  try {
    const channel = (await client.channels.fetch(channelId)) as TextChannel;
    if (!channel) return console.error("[ALERTS] Invalid Channel ID.");

    console.log("[ALERTS] Checking for new mission rotation...");

    // 1. Force Sync
    await forceSyncMissions();

    // 2. Read Data
    if (!fs.existsSync(CACHE_PATH))
      return console.error("[ALERTS] No data found.");
    const fileContent = fs.readFileSync(CACHE_PATH, "utf8");
    const worldData = JSON.parse(fileContent);

    // 3. Hash Check
    const currentHash = getFileHash(fileContent);
    let lastHash = "";
    if (fs.existsSync(HASH_FILE_PATH)) {
      lastHash = fs.readFileSync(HASH_FILE_PATH, "utf8").trim();
    }

    if (!force && currentHash === lastHash) {
      console.log("[ALERTS] Skipped: Data has not changed.");
      return;
    }

    console.log("[ALERTS] New rotation detected! Generating embeds...");

    // --- PREPARE DATA ---
    const missionLookup = new Map();
    worldData.missions.forEach((t: any) =>
      t.availableMissions.forEach((m: any) =>
        missionLookup.set(`${t.theaterId}-${m.tileIndex}`, m)
      )
    );

    const categoryResults: Record<string, Record<string, string[]>> = {};
    ALERT_CATEGORIES.forEach((cat) => {
      categoryResults[cat.name] = {};
    });

    // --- SCAN MISSIONS ---
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
        const is160 = is160Mission(pl);

        const rawBase = mInfo.missionRewards?.items || [];
        const rawAlert = alert.missionAlertRewards?.items || [];

        const baseFiltered = rawBase.filter((i: any) => {
          const t = i.itemType.toLowerCase();
          return !t.includes("eventcurrency") && !t.includes("eventscaling");
        });

        const allItems = [...baseFiltered, ...rawAlert];

        ALERT_CATEGORIES.forEach((category) => {
          let isMatch = false;
          let displayItems: any[] = [];

          if (category.filter === "filter_160") {
            if (is160) {
              isMatch = true;
              displayItems = allItems;
            }
          } else {
            const matchingItems = rawAlert.filter((i: any) =>
              checkRewardMatch(i.itemType, category.filter)
            );
            if (matchingItems.length > 0) {
              isMatch = true;
              displayItems = rawAlert;
            }
          }

          if (isMatch) {
            const zone = resolveZone(theaterId);
            if (!categoryResults[category.name][zone]) {
              categoryResults[category.name][zone] = [];
            }

            const missionName = resolveMissionType(mInfo.missionGenerator);
            const missionIcon = getMissionEmoji(missionName);
            const aggregated = aggregateRewards(displayItems);

            const rewardsStr = aggregated
              .map((i: any) => {
                const item = resolveItem(i.itemType);
                let suffix = "";
                let prefix = "";

                if (
                  category.filter !== "filter_160" &&
                  checkRewardMatch(i.itemType, category.filter)
                ) {
                  prefix = "**";
                  suffix = "**";
                }

                if (category.filter === "filter_160") {
                  prefix = "**";
                  suffix = "**";
                  if (i.itemType.includes("reagent_c_t04_veryhigh")) {
                    item.emoji = "<:shard:1457763923397709946>";
                  } else if (i.itemType.includes("reagent_c_t04_high")) {
                    item.emoji = "<:shard:1457763923397709946>";
                    suffix += " (bad)";
                  }
                }

                return `${prefix}${i.quantity}x${suffix} ${item.emoji}`;
              })
              .join(", ");

            categoryResults[category.name][zone].push(
              `${missionIcon} ⚡ \`${pl}\` | ${rewardsStr}`
            );
          }
        });
      });
    });

    // --- SEND EMBEDS ---
    const dateStr = new Date().toLocaleDateString("en-GB");

    for (const category of ALERT_CATEGORIES) {
      const zoneData = categoryResults[category.name];
      const zonesFound = Object.keys(zoneData);

      // --- EMOJI RESOLUTION ---
      // 1. Use manual emoji if provided (e.g., ⚡ for 160s)
      // 2. Otherwise, resolve the emoji from the 'filter' ID using itemUtils
      let titleEmoji = category.emoji;
      if (!titleEmoji) {
        const resolved = resolveItem(category.filter);
        // Fallback to ? if resolution fails (shouldn't happen for valid items)
        titleEmoji = resolved.type !== "unknown" ? resolved.emoji : "❓";
      }

      const embed = new EmbedBuilder()
        .setTitle(`${titleEmoji} ${category.name} Alerts:`)
        .setTimestamp();

      if (zonesFound.length === 0) {
        embed.setColor(0x2f3136);
        embed.setDescription(
          `❌ **No missions found for ${category.name} today.**`
        );
      } else {
        embed.setColor(category.color);

        const sortedZones = zonesFound.sort(
          (a, b) =>
            ZONE_ORDER.indexOf(
              Object.keys(THEATER_MAP).find((k) => THEATER_MAP[k] === a)!
            ) -
            ZONE_ORDER.indexOf(
              Object.keys(THEATER_MAP).find((k) => THEATER_MAP[k] === b)!
            )
        );

        let desc = "";
        for (const zone of sortedZones) {
          desc += `**${zone.toUpperCase()}**\n${zoneData[zone].join("\n")}\n\n`;
        }

        if (desc.length > 4000) {
          desc = desc.substring(0, 3900) + "\n...(Truncated)";
        }
        embed.setDescription(desc);
      }

      await channel.send({ embeds: [embed] });
    }

    console.log("[ALERTS] All category embeds sent successfully.");
    fs.writeFileSync(HASH_FILE_PATH, currentHash);
  } catch (e) {
    console.error("[ALERTS] Error running auto-alerts:", e);
  }
}
