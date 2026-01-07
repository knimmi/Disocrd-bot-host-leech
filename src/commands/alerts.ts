import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  getPLFromRowName,
  getMissionEmoji,
  getItemEmoji,
  formatReward,
  formatNumber,
} from "../utils/alerts-utils.js";

const PC_BASIC =
  "M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU=";
const USER_AGENT =
  "Fortnite/++Fortnite+Release-14.00-CL-32116959 Windows/10.0.22621.1.768.64bit";

export const data = new SlashCommandBuilder()
  .setName("alerts")
  .setDescription("Scan STW mission alerts for specific rewards")
  .addStringOption((option) =>
    option
      .setName("reward")
      .setDescription("The reward to search for")
      .setRequired(true)
      .addChoices(
        { name: "V-Bucks", value: "currency_mtxswap" },
        { name: "Mythic Leads", value: "manager" },
        { name: "Legendary Survivor", value: "workerbasic_sr_t03" },
        { name: "Epic Perk-Up", value: "reagent_alteration_upgrade_vr" },
        { name: "Upgrade Llama Tokens", value: "voucher_cardpack_bronze" },
        { name: "Fire/Frost/Nature", value: "ele_" },
        { name: "160s (Alerts Only)", value: "filter_160" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    // Path to your service worker account file as per your instructions
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

    const worldRes = await axios.get(
      "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/world/info",
      {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `Bearer ${authRes.data.access_token}`,
        },
      }
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

    const selectedReward = interaction.options.getString("reward") || "";
    const groupedResults: Record<string, string[]> = {};
    let totalSelectedReward = 0;

    missionAlerts.forEach((tGroup: any) => {
      const theaterId = tGroup.theaterId;
      if (!tGroup.availableMissionAlerts) return;

      tGroup.availableMissionAlerts.forEach((alert: any) => {
        const mInfo = missionLookup.get(`${theaterId}-${alert.tileIndex}`);
        if (!mInfo) return;

        /**
         * The API provides rowName in either missionDifficultyInfo or difficultyInfo.
         * The rowName often contains 'Theater_' or 'Phoenix_' prefixes.
         */
        const rowName =
          mInfo.missionDifficultyInfo?.rowName ||
          mInfo.difficultyInfo?.rowName ||
          "";

        const pl = getPLFromRowName(theaterId, rowName);
        const alertItems = alert.missionAlertRewards?.items || [];
        let isMatch = false;

        if (selectedReward === "filter_160") {
          if (pl === "160") {
            isMatch = true;
            alertItems.forEach((i: any) => (totalSelectedReward += i.quantity));
          }
        } else {
          /**
           * FIX: Filter items by stripping prefixes like "AccountResource:"
           * This ensures choices like "ele_" or "currency_mtxswap" match correctly.
           */
          const matchingItems = alertItems.filter((i: any) => {
            const cleanItemType = i.itemType.split(":").pop().toLowerCase();
            return cleanItemType.includes(selectedReward.toLowerCase());
          });

          if (matchingItems.length > 0) {
            isMatch = true;
            matchingItems.forEach(
              (i: any) => (totalSelectedReward += i.quantity)
            );
          }
        }

        if (isMatch) {
          const zone = theaterNames[theaterId] || "Unknown Zone";
          if (!groupedResults[zone]) groupedResults[zone] = [];

          // Use the clean labels and emojis from alerts-utils.js
          groupedResults[zone].push(
            `${getMissionEmoji(mInfo.missionGenerator)} ⚡ \`${pl.padEnd(
              3
            )}\` | ${alertItems
              .map((i: any) => formatReward(i.itemType, i.quantity))
              .join(", ")}`
          );
        }
      });
    });

    const embed = new EmbedBuilder()
      .setTitle(`Mission Alerts: ${selectedReward.replace(/_/g, " ")}`)
      .setColor("#5865F2")
      .setFooter({ text: `Total: ${formatNumber(totalSelectedReward)}` })
      .setTimestamp();

    const zones = Object.keys(groupedResults);
    if (zones.length === 0) {
      embed.setDescription(`❌ No missions found for the selected reward.`);
    } else {
      zones.forEach((zone) =>
        embed.addFields({
          name: `📍 ${zone.toUpperCase()}`,
          value: groupedResults[zone].join("\n").substring(0, 1024),
        })
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("Error in Alerts Command:", error.message);
    await interaction.editReply("❌ Failed to fetch mission data.");
  }
}
