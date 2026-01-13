import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";

// Define Cache Paths
const CACHE_PATH = path.join(process.cwd(), "src", "daily_missions.json");
const CACHE_NO_MODS_PATH = path.join(
  process.cwd(),
  "src",
  "daily_missions_no_guids.json"
);
const CACHE_DEV_PATH = path.join(
  process.cwd(),
  "src",
  "daily_missions_dev.json"
);

export const data = new SlashCommandBuilder()
  .setName("get-file")
  .setDescription("Download the world/info JSON file with optional filtering.")
  .addStringOption((option) =>
    option
      .setName("filter")
      .setDescription("Choose how to filter the data")
      .setRequired(false)
      .addChoices(
        { name: "Normal", value: "normal" },
        { name: "Remove All Mods", value: "remove_all_mods" },
        { name: "Dev Missions", value: "dev_missions" }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    // Ensure the main source exists at minimum
    if (!fs.existsSync(CACHE_PATH)) {
      return await interaction.editReply(
        "❌ Mission data unavailable. Please run a sync first."
      );
    }

    const filter = interaction.options.getString("filter") || "normal";
    const dateSuffix = new Date().toISOString().split("T")[0];

    // --- STRATEGY: Try to serve from Cache first ---

    // 1. Normal (Raw)
    if (filter === "normal") {
      const file = new AttachmentBuilder(CACHE_PATH, {
        name: `world-info-raw-${dateSuffix}.json`,
      });
      return await interaction.editReply({ files: [file] });
    }

    // 2. Remove All Mods (No GUIDs)
    if (filter === "remove_all_mods") {
      // Check Cache First
      if (fs.existsSync(CACHE_NO_MODS_PATH)) {
        const file = new AttachmentBuilder(CACHE_NO_MODS_PATH, {
          name: `world-info-no_mods-${dateSuffix}.json`,
        });
        return await interaction.editReply({ files: [file] });
      } else {
        // Fallback: Generate if cache missing
        console.log("Cache missing for No Mods. Generating on the fly...");
        const rawData = fs.readFileSync(CACHE_PATH, "utf-8");
        const jsonData = JSON.parse(rawData);

        if (Array.isArray(jsonData.missions)) {
          jsonData.missions = jsonData.missions.map((mission: any) => {
            delete mission.missionGuid;
            return mission;
          });
        }

        const buffer = Buffer.from(JSON.stringify(jsonData, null, 2), "utf-8");
        const file = new AttachmentBuilder(buffer, {
          name: `world-info-no_mods-${dateSuffix}.json`,
        });
        return await interaction.editReply({ files: [file] });
      }
    }

    // 3. Dev Missions
    if (filter === "dev_missions") {
      // Check Cache First
      if (fs.existsSync(CACHE_DEV_PATH)) {
        const file = new AttachmentBuilder(CACHE_DEV_PATH, {
          name: `world-info-dev_missions-${dateSuffix}.json`,
        });
        return await interaction.editReply({ files: [file] });
      } else {
        // Fallback: Generate if cache missing
        console.log("Cache missing for Dev Missions. Generating on the fly...");
        const rawData = fs.readFileSync(CACHE_PATH, "utf-8");
        const jsonData = JSON.parse(rawData);
        const processedData = processDevMissions(jsonData);

        const buffer = Buffer.from(
          JSON.stringify(processedData, null, 2),
          "utf-8"
        );
        const file = new AttachmentBuilder(buffer, {
          name: `world-info-dev_missions-${dateSuffix}.json`,
        });
        return await interaction.editReply({ files: [file] });
      }
    }
  } catch (error: any) {
    console.error("Export Error:", error);
    await interaction.editReply(
      "❌ An error occurred while uploading the file."
    );
  }
}

/**
 * Fallback: Applies the Dev Mission regex replacements
 * (Used only if cached file is missing)
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
