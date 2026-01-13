import {
  THEATER_MAP,
  WORLD_POWER_LEVEL,
  THEME_MAP,
  MODS_MAP,
  MISSION_NAME_MAP,
} from "./maps.js";

/**
 * Helper to clean the messy API keys so they match your map.
 * Example: "Theater_Endgame_Group_Zone6" -> "Endgame_Zone6"
 */
function cleanRowName(rowName: string): string {
  return rowName
    .replace("Theater_", "") // Remove prefix
    .replace("_Group", "") // Remove infix
    .replace("Group_", ""); // Just in case
}

export function getPowerLevel(theaterId: string, rowName: string): number {
  if (!rowName) return 0;

  // 1. CLEAN THE NAME
  const cleanName = cleanRowName(rowName);

  // 2. IMMEDIATE OVERRIDES (Fail-safe for 160s)
  if (cleanName === "Endgame_Zone6") return 160;
  if (cleanName === "Endgame_Zone5") return 140;

  // 3. Try Specific Theater Lookup
  const theaterData =
    WORLD_POWER_LEVEL[theaterId] || WORLD_POWER_LEVEL[theaterId.toUpperCase()];
  if (theaterData) {
    if (theaterData[cleanName]) return theaterData[cleanName];
    if (theaterData[rowName]) return theaterData[rowName];
  }

  // 4. Global Search Fallback
  for (const tKey in WORLD_POWER_LEVEL) {
    if (WORLD_POWER_LEVEL[tKey][cleanName]) {
      return WORLD_POWER_LEVEL[tKey][cleanName];
    }
  }

  // 5. Debugging
  console.log(
    `[ZoneUtils] Unknown PL for: "${rowName}" (Clean: "${cleanName}") in Theater: "${theaterId}"`
  );
  return 0;
}

export function resolveZone(theaterId: string): string {
  return (
    THEATER_MAP[theaterId] ||
    THEATER_MAP[theaterId.toUpperCase()] ||
    "Unknown Zone"
  );
}

export function resolveMissionType(missionPath: string): string {
  if (!missionPath) return "Unknown Mission";

  const knownKeys = Object.keys(MISSION_NAME_MAP).sort(
    (a, b) => b.length - a.length
  );
  for (const key of knownKeys) {
    if (missionPath.includes(key)) return MISSION_NAME_MAP[key];
  }

  const parts = missionPath.split("_");
  if (parts.length > 1) {
    const likelyName = parts.find(
      (p) => p !== "MissionGen" && p !== "C" && p.length > 3
    );
    if (likelyName) return likelyName;
  }
  return "Mission";
}

export function resolveBiome(themeString: string): string {
  if (!themeString) return "Unknown Biome";
  if (THEME_MAP[themeString]) return THEME_MAP[themeString];
  const foundKey = Object.keys(THEME_MAP).find((key) =>
    themeString.includes(key)
  );
  return foundKey
    ? THEME_MAP[foundKey]
    : themeString.split("/").pop() || themeString;
}

export function resolveModifiers(modifiers: string[]): string[] {
  if (!modifiers || modifiers.length === 0) return [];
  return modifiers
    .map((mod) => MODS_MAP[mod] || null)
    .filter((name): name is string => name !== null);
}

export function isZoneMatch(theaterId: string, searchName: string): boolean {
  const zoneName = resolveZone(theaterId).toLowerCase();
  return zoneName.includes(searchName.toLowerCase());
}
