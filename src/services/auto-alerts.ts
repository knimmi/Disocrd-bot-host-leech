import { Client, EmbedBuilder, TextChannel } from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  getPLFromRowName,
  getMissionEmoji,
  getItemEmoji,
  formatNumber,
  formatReward,
} from "../utils/alerts-utils.js";

const PC_BASIC =
  "M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU=";
const USER_AGENT =
  "Fortnite/++Fortnite+Release-14.00-CL-32116959 Windows/10.0.22621.1.768.64bit";

const FILTERS = [
  { name: "160s", value: "filter_160" },
  { name: "V-Bucks", value: "currency_mtxswap" },
  { name: "Masters Driver", value: "sid_blunt_club_light" },
  { name: "Fortsville Slugger 3000", value: "sid_blunt_light_rocketbat" },
  { name: "Power B.A.S.E. Knox", value: "hid_constructor_008" },
  { name: "Upgrade Llama Tokens", value: "voucher_cardpack_bronze" },
];

// Added 'force = false' to allow manual overrides while keeping auto-restarts safe
export async function runAutoAlerts(
  client: Client,
  channelId: string,
  force = false
) {
  const resetPath = path.join(process.cwd(), "src", "last_reset.json");
  const dailyMissionsPath = path.join(
    process.cwd(),
    "src",
    "daily_missions.json"
  );

  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Check for 24h Cache
  if (fs.existsSync(resetPath)) {
    try {
      const lastResetData = JSON.parse(fs.readFileSync(resetPath, "utf8"));
      const lastRun = lastResetData.lastRunTimestamp || 0;

      // Logic: Only skip if (!force) AND time is valid AND mission file exists
      if (
        !force &&
        now - lastRun < TWENTY_FOUR_HOURS &&
        fs.existsSync(dailyMissionsPath)
      ) {
        const remainingMs = TWENTY_FOUR_HOURS - (now - lastRun);
        const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);
        console.log(
          `[Auto-Alerts] Cache valid. Skipping. Next run available in ${remainingHours} hours.`
        );
        return;
      }
    } catch (err) {
      console.error("Error reading cache file, proceeding with fetch.");
    }
  }

  const channel = client.channels.cache.get(channelId) as TextChannel;
  if (!channel) return console.error("Invalid channel ID for auto-alerts.");

  try {
    // Authentication
    const credsPath = path.join(process.cwd(), "src", "credentials.json");
    const { accountId, deviceId, secret } = JSON.parse(
      fs.readFileSync(credsPath, "utf8")
    );

    const authRes = await axios.post(
      "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
      new URLSearchParams({
        grant_type: "device_auth",
        account_id: accountId,
        device_id: deviceId,
        secret,
      }).toString(),
      {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `basic ${PC_BASIC}`,
        },
      }
    );

    // Fetch World Data
    const worldRes = await axios.get(
      "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/world/info",
      {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `Bearer ${authRes.data.access_token}`,
        },
      }
    );
    fs.writeFileSync(dailyMissionsPath, JSON.stringify(worldRes.data, null, 2));
    console.log(
      `[Auto-Alerts] Successfully saved mission data to ${dailyMissionsPath}`
    );

    const { theaters, missionAlerts, missions: missionData } = worldRes.data;
    const theaterNames: Record<string, string> = {};
    theaters.forEach((t: any) => (theaterNames[t.uniqueId] = t.displayName.en));

    const missionLookup = new Map();
    missionData.forEach((theater: any) => {
      theater.availableMissions.forEach((m: any) =>
        missionLookup.set(`${theater.theaterId}-${m.tileIndex}`, m)
      );
    });

    // Process each filter
    for (const filter of FILTERS) {
      const groupedResults: Record<
        string,
        { quantity: number; text: string }[]
      > = {};
      let totalSelectedReward = 0;

      missionAlerts.forEach((tGroup: any) => {
        const theaterId = tGroup.theaterId;
        if (!tGroup.availableMissionAlerts) return;

        tGroup.availableMissionAlerts.forEach((alert: any) => {
          const mInfo = missionLookup.get(`${theaterId}-${alert.tileIndex}`);
          if (!mInfo) return;

          const pl = getPLFromRowName(
            theaterId,
            mInfo.missionDifficultyInfo?.rowName ||
              mInfo.difficultyInfo?.rowName ||
              ""
          );
          let displayItems: any[] = [];
          let isMatch = false;
          let currentMissionQuantity = 0;

          if (filter.value === "filter_160") {
            if (pl === "160") {
              isMatch = true;
              const rawRewards = (mInfo.missionRewards?.items || []).filter(
                (i: any) => {
                  const type = i.itemType.toLowerCase();
                  return (
                    !type.includes("gold") &&
                    !type.includes("eventscaling") &&
                    !type.includes("eventcurrency")
                  );
                }
              );
              const groupedRewards: Record<string, number> = {};
              rawRewards.forEach((item: any) => {
                groupedRewards[item.itemType] =
                  (groupedRewards[item.itemType] || 0) + item.quantity;
              });
              displayItems = Object.keys(groupedRewards).map((type) => ({
                itemType: type,
                quantity: groupedRewards[type],
              }));
            }
          } else {
            const alertItems = alert.missionAlertRewards?.items || [];
            const matchingItems = alertItems.filter((i: any) => {
              const rawType = i.itemType.toLowerCase();
              const cleanType = rawType.split(":").pop() || "";
              return (
                cleanType === filter.value.toLowerCase() ||
                rawType.includes(filter.value.toLowerCase())
              );
            });

            if (matchingItems.length > 0) {
              isMatch = true;
              displayItems = alertItems;
              matchingItems.forEach(
                (i: any) => (currentMissionQuantity += i.quantity)
              );
            }
          }

          if (isMatch) {
            const zone = theaterNames[theaterId] || "Unknown Zone";
            if (!groupedResults[zone]) groupedResults[zone] = [];

            let rewardText =
              filter.value === "filter_160"
                ? displayItems
                    .map(
                      (i: any) => `${i.quantity}x ${getItemEmoji(i.itemType)}`
                    )
                    .join(", ")
                : displayItems
                    .map((i: any) => formatReward(i.itemType, i.quantity))
                    .join(", ");

            if (rewardText) {
              totalSelectedReward += currentMissionQuantity;
              groupedResults[zone].push({
                quantity: currentMissionQuantity,
                text: `${getMissionEmoji(
                  mInfo.missionGenerator
                )} ⚡ \`${pl.padEnd(3)}\` | ${rewardText}`,
              });
            }
          }
        });
      });

      // Create and send embed
      const zones = Object.keys(groupedResults);
      const embed = new EmbedBuilder()
        .setTitle(`STW Alerts For: ${filter.name}`)
        .setColor("#5865F2")
        .setTimestamp();

      if (zones.length > 0) {
        embed.setFooter({
          text: `Total Items: ${formatNumber(totalSelectedReward)}`,
        });

        zones.forEach((zone) => {
          const sortedText = groupedResults[zone]
            .sort((a, b) => b.quantity - a.quantity)
            .map((m) => m.text)
            .join("\n");

          embed.addFields({
            name: `${zone.toUpperCase()}`,
            value: sortedText.substring(0, 1024),
          });
        });
      } else {
        embed.setDescription(`❌ No missions found for **${filter.name}**.`);
        embed.setFooter({ text: "Better luck next reset!" });
      }

      await channel.send({ embeds: [embed] });
    }

    // last_reset.json with current timestamp
    fs.writeFileSync(
      resetPath,
      JSON.stringify({ lastRunTimestamp: now }, null, 2)
    );
    console.log(`[Auto-Alerts] Successfully posted. Cache updated.`);
  } catch (error: any) {
    console.error("Alert error:", error.message);
  }
}
