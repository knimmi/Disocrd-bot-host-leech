import fs from "fs";
import path from "path";
import axios from "axios";
import { EmbedBuilder, TextChannel, Client } from "discord.js";
import {
  getPLFromRowName,
  getMissionEmoji,
  getItemEmoji,
  formatReward,
} from "../utils/alerts-utils.js";

const TRACKER_PATH = path.join(process.cwd(), "src", "last_reset.json");
const CREDS_PATH = path.join(process.cwd(), "src", "credentials.json");
const PC_BASIC =
  "M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU=";

export async function checkAndSendAlerts(client: Client, channelId: string) {
  try {
    if (!fs.existsSync(CREDS_PATH)) {
      console.error("❌ Scanner: credentials.json not found.");
      return;
    }

    const { accountId, deviceId, secret } = JSON.parse(
      fs.readFileSync(CREDS_PATH, "utf8")
    );

    // 1. Auth & World Info Fetch
    const authRes = await axios.post(
      "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
      new URLSearchParams({
        grant_type: "device_auth",
        account_id: accountId,
        device_id: deviceId,
        secret,
      }).toString(),
      { headers: { Authorization: `basic ${PC_BASIC}` } }
    );

    const worldRes = await axios.get(
      "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/world/info",
      {
        headers: { Authorization: `Bearer ${authRes.data.access_token}` },
      }
    );

    const apiRefreshTime = worldRes.data.missionAlerts[0]?.nextRefresh;
    if (!apiRefreshTime) return;

    // 2. Prevent Double-Posting
    let tracker = { lastPostedRefresh: "" };
    if (fs.existsSync(TRACKER_PATH)) {
      tracker = JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
    }

    // If you want to force a test, delete last_reset.json or comment this line out
    if (tracker.lastPostedRefresh === apiRefreshTime) {
      console.log(
        "✅ Scanner: Alerts for this reset already posted. Skipping."
      );
      return;
    }

    // 3. Fetch the Specific Channel
    const channel = (await client.channels.fetch(channelId)) as TextChannel;
    if (!channel) {
      return console.error(
        `❌ Scanner: Could not find channel with ID: ${channelId}`
      );
    }

    const { theaters, missionAlerts, missions: missionData } = worldRes.data;
    const missionLookup = new Map();
    missionData.forEach((theater: any) => {
      theater.availableMissions.forEach((m: any) =>
        missionLookup.set(`${theater.theaterId}-${m.tileIndex}`, m)
      );
    });

    const vbucksResults: Record<string, string[]> = {};
    const llamaResults: Record<string, string[]> = {};

    missionAlerts.forEach((tGroup: any) => {
      tGroup.availableMissionAlerts?.forEach((alert: any) => {
        const mInfo = missionLookup.get(
          `${tGroup.theaterId}-${alert.tileIndex}`
        );
        if (!mInfo) return;

        const alertItems = alert.missionAlertRewards?.items || [];
        const rowName =
          mInfo.difficultyInfo?.rowName ||
          mInfo.missionDifficultyInfo?.rowName ||
          "";

        const pl = getPLFromRowName(tGroup.theaterId, rowName);
        const zone =
          theaters.find((t: any) => t.uniqueId === tGroup.theaterId)
            ?.displayName.en || "Unknown";

        const line = `${getMissionEmoji(
          mInfo.missionGenerator
        )} ⚡ \`${pl.padEnd(3)}\` | ${alertItems
          .map((i: any) => formatReward(i.itemType, i.quantity))
          .join(", ")}`;

        if (
          alertItems.some((i: any) =>
            i.itemType.toLowerCase().includes("currency_mtxswap")
          )
        ) {
          if (!vbucksResults[zone]) vbucksResults[zone] = [];
          vbucksResults[zone].push(line);
        }

        if (
          alertItems.some((i: any) =>
            i.itemType.toLowerCase().includes("voucher_cardpack_bronze")
          )
        ) {
          if (!llamaResults[zone]) llamaResults[zone] = [];
          llamaResults[zone].push(line);
        }
      });
    });

    // 4. Send the Feeds
    const foundVbucks = Object.keys(vbucksResults).length > 0;
    const foundLlamas = Object.keys(llamaResults).length > 0;

    if (foundVbucks) {
      const vEmbed = new EmbedBuilder()
        .setTitle("Daily V-Bucks Found!")
        .setColor("#00EAFF")
        .setTimestamp();

      Object.keys(vbucksResults).forEach((z) =>
        vEmbed.addFields({
          name: `📍 ${z.toUpperCase()}`,
          value: vbucksResults[z].join("\n"),
        })
      );
      await channel.send({ embeds: [vEmbed] });
    }

    if (foundLlamas) {
      const lEmbed = new EmbedBuilder()
        .setTitle("Upgrade Llama Tokens Found!")
        .setColor("#FFD700")
        .setTimestamp();

      Object.keys(llamaResults).forEach((z) =>
        lEmbed.addFields({
          name: `📍 ${z.toUpperCase()}`,
          value: llamaResults[z].join("\n"),
        })
      );
      await channel.send({ embeds: [lEmbed] });
    }

    // 5. Send "No Alerts" embed if filters are empty
    if (!foundVbucks && !foundLlamas) {
      const emptyEmbed = new EmbedBuilder()
        .setTitle("Mission Reset Status")
        .setDescription(
          "The missions have refreshed, but **no V-Bucks or Llama Tokens** were found in today's rotation."
        )
        .setColor("#5865F2")
        .setTimestamp()
        .setFooter({ text: "Better luck tomorrow!" });

      await channel.send({ embeds: [emptyEmbed] });
    }

    // 6. Save reset time to prevent duplicate posts
    fs.writeFileSync(
      TRACKER_PATH,
      JSON.stringify({ lastPostedRefresh: apiRefreshTime })
    );
    console.log(`✅ Scanner: Processed reset for ${apiRefreshTime}`);
  } catch (err: any) {
    console.error("❌ Scanner error:", err.message);
  }
}
