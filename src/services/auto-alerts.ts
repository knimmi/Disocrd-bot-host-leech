import {
  Client,
  TextChannel,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
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

// --- FILE PATHS ---
const CACHE_PATH = path.join(process.cwd(), "src", "daily_missions.json");
const CACHE_NO_GUIDS_PATH = path.join(
  process.cwd(),
  "src",
  "daily_missions_no_guids.json"
);
const CACHE_DEV_PATH = path.join(
  process.cwd(),
  "src",
  "daily_missions_dev.json"
);
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

/**
 * Applies the Dev Mission regex replacements
 */
function processDevMissions(data: any): any {
  let jsonString = JSON.stringify(data);

  const replacements = [
    { searchText: "EventFlag", replacementText: "NotEventFlag" },
    {
      searchText: "activeQuestDefinitions",
      replacementText: "NotactiveQuestDefinitions",
    },
    { searchText: "requirements", replacementText: "Notrequirements" },
    {
      searchText:
        "/Script/Engine.DataTable'/Game/Balance/DataTables/GameDifficultyGrowthBounds.GameDifficultyGrowthBounds'",
      replacementText: "powerlevel",
    },
    {
      searchText: '"theaterType"\\s*:\\s*"Tutorial"',
      replacementText: '"theaterType": "Standard"',
    },
    {
      searchText: '"bHideLikeTestTheater":\\s*true',
      replacementText: '"bHideLikeTestTheater": false',
    },
    {
      searchText: '"missionGenerator"\\s*:\\s*"None"',
      replacementText:
        '"missionGenerator": "/SaveTheWorld/World/MissionGens/MissionGen_T1_HT_EvacuateTheSurvivors.MissionGen_T1_HT_EvacuateTheSurvivors_C"',
    },
    {
      searchText: '"Theater_Phoenix_Zone02"',
      replacementText: '"Theater_Start_Zone2"',
    },
    {
      searchText: '"Theater_Phoenix_Zone03"',
      replacementText: '"Theater_Start_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone03"',
      replacementText: '"Theater_Start_Group_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Zone05"',
      replacementText: '"Theater_Start_Zone5"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone05"',
      replacementText: '"Theater_Start_Group_Zone5"',
    },
    {
      searchText: '"Theater_Phoenix_Zone07"',
      replacementText: '"Theater_Normal_Zone2"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone07"',
      replacementText: '"Theater_Normal_Group_Zone2"',
    },
    {
      searchText: '"Theater_Phoenix_Zone09"',
      replacementText: '"Theater_Normal_Zone4"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone09"',
      replacementText: '"Theater_Normal_Group_Zone4"',
    },
    {
      searchText: '"Theater_Phoenix_Zone11"',
      replacementText: '"Theater_Hard_Zone1"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone11"',
      replacementText: '"Theater_Hard_Group_Zone1"',
    },
    {
      searchText: '"Theater_Phoenix_Zone13"',
      replacementText: '"Theater_Hard_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone13"',
      replacementText: '"Theater_Hard_Group_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Zone15"',
      replacementText: '"Theater_Hard_Zone5"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone15"',
      replacementText: '"Theater_Hard_Group_Zone5"',
    },
    {
      searchText: '"Theater_Phoenix_Zone17"',
      replacementText: '"Theater_Nightmare_Zone2"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone17"',
      replacementText: '"Theater_Nightmare_Group_Zone2"',
    },
    {
      searchText: '"Theater_Phoenix_Zone19"',
      replacementText: '"Theater_Nightmare_Zone4"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone19"',
      replacementText: '"Theater_Nightmare_Group_Zone4"',
    },
    {
      searchText: '"Theater_Phoenix_Zone21"',
      replacementText: '"Theater_Endgame_Zone1"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone21"',
      replacementText: '"Theater_Endgame_Group_Zone1"',
    },
    {
      searchText: '"Theater_Phoenix_Zone23"',
      replacementText: '"Theater_Endgame_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone23"',
      replacementText: '"Theater_Endgame_Group_Zone3"',
    },
    {
      searchText: '"Theater_Phoenix_Zone25"',
      replacementText: '"Theater_Endgame_Zone5"',
    },
    {
      searchText: '"Theater_Phoenix_Group_Zone25"',
      replacementText: '"Theater_Endgame_Group_Zone5"',
    },
    {
      searchText: '"theaterSlot"\\s*:\\s*2',
      replacementText: '"theaterSlot": 0',
    },
    { searchText: "HV3_01", replacementText: "Start_Zone4" },
    { searchText: "HV3_02", replacementText: "Start_Zone5" },
    { searchText: "HV3_03", replacementText: "Normal_Zone2" },
    { searchText: "HV3_04", replacementText: "Normal_Zone4" },
    { searchText: "HV3_05", replacementText: "Hard_Zone1" },
    { searchText: "HV3_06", replacementText: "Hard_Zone3" },
    { searchText: "HV3_07", replacementText: "Hard_Zone5" },
    { searchText: "HV3_08", replacementText: "Nightmare_Zone2" },
    { searchText: "HV3_09", replacementText: "Nightmare_Zone4" },
    { searchText: "HV3_10", replacementText: "Endgame_Zone1" },
    { searchText: "HV3_11", replacementText: "Endgame_Zone3" },
    { searchText: "HV3_12", replacementText: "Endgame_Zone5" },
    { searchText: "_Starlight_Start_Zone2", replacementText: "_Start_Zone3" },
    {
      searchText: "_StarlightTimed_Start_Zone2",
      replacementText: "_Start_Zone3",
    },
    { searchText: "Theater_Starlight_", replacementText: "Theater_" },
    { searchText: "_StarlightTimed_", replacementText: "_" },
    { searchText: "Theater_Endless_", replacementText: "Theater_" },
    {
      searchText: "Theater_Mayday_Start_Zone5",
      replacementText: "Theater_Start_Zone5",
    },
    {
      searchText: "Theater_Mayday_Normal_Zone3",
      replacementText: "Theater_Normal_Zone3",
    },
    {
      searchText: "Theater_Mayday_Normal_Zone5",
      replacementText: "Theater_Normal_Zone5",
    },
    {
      searchText: "Theater_Mayday_Hard_Zone3",
      replacementText: "Theater_Hard_Zone3",
    },
    {
      searchText: "Theater_Mayday_Hard_Zone5",
      replacementText: "Theater_Hard_Zone5",
    },
    {
      searchText: "Theater_Mayday_Nightmare_Zone3",
      replacementText: "Theater_Nightmare_Zone3",
    },
    {
      searchText: "Theater_Mayday_Nightmare_Zone5",
      replacementText: "Theater_Nightmare_Zone5",
    },
    {
      searchText: "Theater_Mayday_Endgame_Zone5",
      replacementText: "Theater_Endgame_Zone5",
    },
  ];

  for (const item of replacements) {
    const regex = new RegExp(item.searchText, "gi");
    jsonString = jsonString.replace(regex, item.replacementText);
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to re-parse JSON in processDevMissions", e);
    return data;
  }
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
    // This updates the main 'daily_missions.json'
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

    console.log("[ALERTS] New rotation detected! Processing...");

    const dateSuffix = new Date().toISOString().split("T")[0];

    // --- STEP 4: GENERATE, CACHE, AND SEND FILES ---
    // We prepare the 3 types of files, SAVE them to disk, then send them.

    const filesToSend: AttachmentBuilder[] = [];

    // A. Normal File (Already cached by sync-utils, just read/attach)
    filesToSend.push(
      new AttachmentBuilder(CACHE_PATH, {
        name: `world-info-raw-${dateSuffix}.json`,
      })
    );

    // B. Remove All GUIDs
    // B. Remove All GUIDs (Replaced with 'eee')
    try {
      const rawDataString = JSON.stringify(worldData, null, 2);

      // FIX: Use Regex to find GUID patterns and replace them with "eee"
      // instead of deleting the property keys.
      const guidRegex =
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const processedNoGuidString = rawDataString.replace(guidRegex, "eee");

      // Save the modified string to disk
      fs.writeFileSync(CACHE_NO_GUIDS_PATH, processedNoGuidString);
      console.log(
        `[ALERTS] Cached No-GUIDs file (replaced with 'eee') to ${CACHE_NO_GUIDS_PATH}`
      );

      // Add to attachment list
      filesToSend.push(
        new AttachmentBuilder(Buffer.from(processedNoGuidString, "utf-8"), {
          name: `world-info-no_guids-${dateSuffix}.json`,
        })
      );
    } catch (err) {
      console.error("Error creating No GUIDs file:", err);
    }

    // C. Dev Missions
    try {
      const devData = processDevMissions(worldData);
      const devString = JSON.stringify(devData, null, 2);

      // Save to disk
      fs.writeFileSync(CACHE_DEV_PATH, devString);
      console.log(`[ALERTS] Cached Dev Missions file to ${CACHE_DEV_PATH}`);

      // Add to attachment list
      filesToSend.push(
        new AttachmentBuilder(Buffer.from(devString, "utf-8"), {
          name: `world-info-dev_missions-${dateSuffix}.json`,
        })
      );
    } catch (err) {
      console.error("Error creating Dev Missions file:", err);
    }

    // Send the files immediately
    if (filesToSend.length > 0) {
      console.log("[ALERTS] Mission files uploaded.");
    }

    // --- STEP 5: GENERATE & SEND EMBEDS ---
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
    for (const category of ALERT_CATEGORIES) {
      const zoneData = categoryResults[category.name];
      const zonesFound = Object.keys(zoneData);

      // --- EMOJI RESOLUTION ---
      let titleEmoji = category.emoji;
      if (!titleEmoji) {
        const resolved = resolveItem(category.filter);
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
