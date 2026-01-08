import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";
import {
  getPLFromRowName,
  getMissionEmoji,
  formatReward,
  formatNumber,
  getItemEmoji,
} from "../utils/alerts-utils.js";

const REWARD_CHOICES = [
  { name: "V-Bucks", value: "currency_mtxswap" },
  { name: "Mythic Leads", value: "manager" },
  { name: "Upgrade Llama Tokens", value: "voucher_cardpack_bronze" },
  { name: "Mini Llamas", value: "voucher_basicpack" },
  { name: "Masters Driver", value: "sid_blunt_club_light" },
  { name: "Fortsville Slugger 3000", value: "sid_blunt_light_rocketbat" },
  { name: "Power B.A.S.E. Knox", value: "hid_constructor_008" },
  { name: "Legendary Survivor", value: "workerbasic_sr_t03" },
  { name: "Legendary Schematics", value: "filter_leg_schematic" },
  { name: "Legendary Heroes", value: "filter_leg_hero" },
  // Epic Perk-Up removed from here
  { name: "Fire-Up", value: "reagent_alteration_ele_fire" },
  { name: "Frost-Up", value: "reagent_alteration_ele_water" },
  { name: "Amp-Up", value: "reagent_alteration_ele_nature" },
  { name: "160s", value: "filter_160" },
];

export const data = new SlashCommandBuilder()
  .setName("alerts")
  .setDescription("Scan STW mission alerts for specific rewards")
  .addStringOption((option) =>
    option
      .setName("reward")
      .setDescription("The reward to search for")
      .setRequired(true)
      .addChoices(...REWARD_CHOICES)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const cachePath = path.join(process.cwd(), "src", "daily_missions.json");
    const resetPath = path.join(process.cwd(), "src", "last_reset.json");

    if (!fs.existsSync(cachePath) || !fs.existsSync(resetPath)) {
      return await interaction.editReply(
        "❌ Mission data is currently unavailable. Please wait for the daily sync."
      );
    }

    const resetData = JSON.parse(fs.readFileSync(resetPath, "utf8"));
    const lastRun = resetData.lastRunTimestamp || 0;
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const isStale = now - lastRun > TWENTY_FOUR_HOURS;

    const worldData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    const fileStats = fs.statSync(cachePath);
    const lastUpdated = new Date(lastRun || fileStats.mtime);

    const { theaters, missionAlerts, missions: missionData } = worldData;
    const theaterNames: Record<string, string> = {};
    theaters.forEach((t: any) => (theaterNames[t.uniqueId] = t.displayName.en));

    const missionLookup = new Map();
    missionData.forEach((theater: any) => {
      theater.availableMissions.forEach((m: any) =>
        missionLookup.set(`${theater.theaterId}-${m.tileIndex}`, m)
      );
    });

    const selectedReward = interaction.options.getString("reward") || "";
    const rewardDisplayName =
      REWARD_CHOICES.find((c: any) => c.value === selectedReward)?.name ||
      "Rewards";

    const groupedResults: Record<string, { quantity: number; text: string }[]> =
      {};
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

        if (selectedReward === "filter_160") {
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

            // Logic check: Explicitly ignore Epic Perk-Up if it somehow reaches here
            if (cleanType === "reagent_alteration_upgrade_vr") return false;

            if (selectedReward === "filter_leg_schematic")
              return cleanType.startsWith("sid_") && cleanType.includes("_sr_");
            if (selectedReward === "filter_leg_hero")
              return cleanType.startsWith("hid_") && cleanType.includes("_sr_");
            return (
              cleanType === selectedReward.toLowerCase() ||
              rawType.includes(selectedReward.toLowerCase()) ||
              (selectedReward === "manager" && cleanType.includes("manager")) ||
              (selectedReward === "voucher_basicpack" &&
                (cleanType.includes("voucher_basicpack") ||
                  cleanType.includes("cardpack_mini")))
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

          let rewardText;
          if (selectedReward === "filter_160") {
            displayItems.forEach(
              (i: any) => (currentMissionQuantity += i.quantity)
            );
            rewardText = displayItems
              .map((i: any) => `${i.quantity}x ${getItemEmoji(i.itemType)}`)
              .join(", ");
          } else {
            rewardText = displayItems
              .map((i: any) => formatReward(i.itemType, i.quantity))
              .join(", ");
          }

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

    const embed = new EmbedBuilder()
      .setTitle(`Mission Alerts For: ${rewardDisplayName}`)
      .setColor(isStale ? "#FFA500" : "#5865F2")
      .setFooter({
        text: `Total: ${formatNumber(totalSelectedReward)}`,
      })
      .setTimestamp();

    const zones = Object.keys(groupedResults);
    if (zones.length === 0) {
      embed.setDescription(
        `❌ No missions found for **${rewardDisplayName}**.`
      );
    } else {
      zones.forEach((zone) => {
        let sortedText = groupedResults[zone]
          .sort((a, b) => b.quantity - a.quantity)
          .map((m) => m.text)
          .join("\n");
        if (sortedText.length > 1024) {
          sortedText =
            sortedText.substring(0, sortedText.lastIndexOf("\n", 1021)) +
            "\n...";
        }
        embed.addFields({
          name: `${zone.toUpperCase()}`,
          value: sortedText,
        });
      });
    }
    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error("Error:", error.message);
    if (interaction.deferred)
      await interaction.editReply("❌ Error reading mission data.");
  }
}
