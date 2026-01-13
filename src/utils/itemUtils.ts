import {
  RESOURCE_MAP,
  TRAP_MAP,
  WEAPON_MAP,
  HERO_MAP,
  MISSION_NAME_MAP,
  RARITY_CODE_TO_NAME,
} from "./maps.js";

// --- Interfaces ---
export interface GameItem {
  id: string;
  rawId: string;
  name: string;
  emoji: string;
  rarity: string;
  type:
    | "hero"
    | "schematic"
    | "trap"
    | "survivor"
    | "defender"
    | "resource"
    | "mission"
    | "unknown";
}

export const REWARD_EMOJIS = {
  UC_PERK: "<:ucperk:1458453604787552362>",
  C_PERK: "<:cperk:1458453583392673853>",
  MINI_LLAMA: "<:ml:1458495881878831258>",
  RE_PERK: "<:reperk:1458176552855670836>",
  EYE: "<:eye:1457763941051797708>",
  SHARD: "<:shard:1457763923397709946>",
  LIAB: "<:liab:1457763908248010927>",
  PDOR: "<:pdor:1457763893509230622>",
  TRAINING_MANUAL: "<:pmanual:1458441804813963274>",
  WEAPON_DESIGN: "<:mmanuals:1458441788749516862>",
  TRAP_DESIGN: "<:tmanuals:1458441775231402076>",
  XRAY_TICKET: "<a:rickets:1458179312883601428>",
  FIRE_UP: "<:fireup:1458177350570217472>",
  ICE_UP: "<:iceup:1458177333033697543>",
  AMP_UP: "<:ampup:1458177320933130271>",
  VENTURE_XP: "<:ventxp:1458176649131462686>",
  GOLD: "<:gold:1458176540130017363>",
  VBUCKS: "<:vbucks:1457696912621834436>",
  SURVIVOR_XP: "<:suxp:1457764500081217627>",
  HERO_XP: "<:heroxp:1457764481835995228>",
  SCHEMATIC_XP: "<:ruben:1457764464609726587>",
  LEG_PERK: "<:lp:1457763973784146013>",
  EPIC_PERK: "<:ep:1457763879055786026>",
  MYTHIC: "🌟",
};

export const MISSION_EMOJIS = {
  ENCAMPMENTS: "<:encamp:1457707158786281492>",
  RESUPPLY: "<:resup:1457706566903009381>",
  DTB: "<:dtb:1457706552516546725>",
  ELIMINATE: "<:elim:1457706540235755561>",
  RTL: "<:rtl:1457705404053065739>",
  EVACUATE: "<:evac:1457705381080858819>",
  REPAIR: "<:rts:1457705367482929309>",
  RADAR: "<:radar:1457705350613565615>",
  RTD: "<:rtd:1457705334071099494>",
  RESCUE: "<:sur:1457705319718195332>",
  REFUEL: "<:refuel:1457705306313199698>",
  LLAMA: "<:llama:1457700803254026241>",
  CAT3: "<:cat3:1457700186833817620>",
  CAT2: "<:cat2:1457700175572373667>",
  CAT1: "<:cat1:1457699998933450807>",
  CAT4: "<:cat4:1457699986211868779>",
  LTR: "<:ltr:1458162046439915753>",
  MSK: "<:msk:1458162028228116554>",
  HTM: "<:htt:1458731598311723139>",
};

// --- Emojis ---
const CUSTOM_ICONS: Record<string, string> = {
  hid_constructor_008: "<:knox:1459508528518529166>",
  sid_blunt_light_rocketbat: "<:slugger:1457711578404098089>",
  sid_blunt_club_light: "<:driver:1457711561756901409>",
};

const RARITY_EMOJIS: Record<string, Record<string, string>> = {
  hero: {
    common: "⚪<:heros:1459264287825727540>",
    uncommon: "🟢<:heros:1459264287825727540>",
    rare: "🔵<:heros:1459264287825727540>",
    epic: "🟣<:heros:1459264287825727540>",
    legendary: "🟠<:heros:1459264287825727540>",
    mythic: "🟡<:heros:1459264287825727540>",
  },
  schematic: {
    common: "⚪<:weapons:1459264305097867370>",
    uncommon: "🟢<:weapons:1459264305097867370>",
    rare: "🔵<:weapons:1459264305097867370>",
    epic: "🟣<:weapons:1459264305097867370>",
    legendary: "🟠<:weapons:1459264305097867370>",
    mythic: "🟡<:weapons:1459264305097867370>",
  },
  trap: {
    common: "⚪<:trap:1459848437100187843>",
    uncommon: "🟢<:trap:1459848437100187843>",
    rare: "🔵<:trap:1459848437100187843>",
    epic: "🟣<:trap:1459848437100187843>",
    legendary: "🟠<:trap:1459848437100187843>",
    mythic: "🟡<:trap:1459848437100187843>",
  },
  survivor: {
    common: "⚪<:surv:1458442238185967830>",
    uncommon: "🟢<:surv:1458442238185967830>",
    rare: "🔵<:surv:1458442238185967830>",
    epic: "🟣<:surv:1458442238185967830>",
    legendary: "🟠<:surv:1458442238185967830>",
    mythic: "🟡<:surv:1458442238185967830>",
  },
  defender: {
    common: "⚪<:defender:1459848452963041281>",
    uncommon: "🟢<:defender:1459848452963041281>",
    rare: "🔵<:defender:1459848452963041281>",
    epic: "🟣<:defender:1459848452963041281>",
    legendary: "🟠<:defender:1459848452963041281>",
    mythic: "🟡<:defender:1459848452963041281>",
  },
  unknown: {
    common: "📦",
  },
};

const STATIC_ICONS: Record<string, string> = {
  "V-Bucks": REWARD_EMOJIS.VBUCKS,
  "X-Ray Tickets": REWARD_EMOJIS.XRAY_TICKET,
  Gold: REWARD_EMOJIS.GOLD,
  "Pure Drop of Rain": REWARD_EMOJIS.PDOR,
  "Lightning in a Bottle": REWARD_EMOJIS.LIAB,
  "Eye of the Storm": REWARD_EMOJIS.EYE,
  "Storm Shard": REWARD_EMOJIS.SHARD,
  "RE-PERK!": REWARD_EMOJIS.RE_PERK,
  "Hero XP": REWARD_EMOJIS.HERO_XP,
  "Schematic XP": REWARD_EMOJIS.SCHEMATIC_XP,
  "Survivor XP": REWARD_EMOJIS.SURVIVOR_XP,
  "Venture XP": REWARD_EMOJIS.VENTURE_XP,
  "Uncommon PERK-UP!": REWARD_EMOJIS.UC_PERK,
  "Rare PERK-UP!": REWARD_EMOJIS.C_PERK,
  "Epic PERK-UP!": REWARD_EMOJIS.EPIC_PERK,
  "Legendary PERK-UP!": REWARD_EMOJIS.LEG_PERK,
  "FIRE UP": REWARD_EMOJIS.FIRE_UP,
  "AMP UP": REWARD_EMOJIS.AMP_UP,
  "FROST UP": REWARD_EMOJIS.ICE_UP,
  "Mini Llama": REWARD_EMOJIS.MINI_LLAMA,
  "Upgrade Llama": MISSION_EMOJIS.LLAMA,
  "Event Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Adventure Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Blockbuster Tickets": REWARD_EMOJIS.XRAY_TICKET,
  Candy: REWARD_EMOJIS.XRAY_TICKET,
  "Lunar Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Road Trip Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Snowflake Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Spring Tickets": REWARD_EMOJIS.XRAY_TICKET,
  "Summer Tickets": REWARD_EMOJIS.XRAY_TICKET,
  // Manuals/Designs removed as they are not mission rewards
};

const MISSION_ICONS: Record<string, string> = {
  "Fight the Storm (Category 1)": MISSION_EMOJIS.CAT1,
  "Fight the Storm (1 Atlas)": MISSION_EMOJIS.CAT1,
  "Fight the Storm (2 Atlases)": MISSION_EMOJIS.CAT2,
  "Fight the Storm (3 Atlases)": MISSION_EMOJIS.CAT3,
  "Fight the Storm (4 Atlases)": MISSION_EMOJIS.CAT4,
  "Deliver the Bomb": MISSION_EMOJIS.DTB,
  "Destroy the Encampments": MISSION_EMOJIS.ENCAMPMENTS,
  "Eliminate and Collect": MISSION_EMOJIS.ELIMINATE,
  "Evacuate the Shelter": MISSION_EMOJIS.EVACUATE,
  "Rescue the Survivors": MISSION_EMOJIS.RESCUE,
  "Build the Radar Grid": MISSION_EMOJIS.RADAR,
  "Refuel the Homebase": MISSION_EMOJIS.REFUEL,
  Resupply: MISSION_EMOJIS.RESUPPLY,
  "Launch the Rocket": MISSION_EMOJIS.LTR,
  "Retrieve the Data": MISSION_EMOJIS.RTD,
  "Ride the Lightning": MISSION_EMOJIS.RTL,
  "Repair the Shelter": MISSION_EMOJIS.REPAIR,
  "Hunt The Titan": MISSION_EMOJIS.HTM,
  "Mythic Storm King": MISSION_EMOJIS.MSK,
  Portal: MISSION_EMOJIS.MSK,
};

function extractRarity(templateId: string): string {
  const parts = templateId.toLowerCase().split("_");
  for (const part of parts) {
    const rarityName = RARITY_CODE_TO_NAME[part];
    if (rarityName && typeof rarityName === "string") {
      return rarityName.toLowerCase();
    }
  }
  return "common";
}

function cleanPrefix(itemType: string): string {
  if (!itemType) return "";
  const parts = itemType.split(":");
  return parts[parts.length - 1] || itemType;
}

export function getMissionEmoji(missionNameOrId: string): string {
  const cleanName = MISSION_NAME_MAP[missionNameOrId] || missionNameOrId;
  if (MISSION_ICONS[cleanName]) return MISSION_ICONS[cleanName];
  if (cleanName.includes("Atlas")) return "🌐";
  if (cleanName.includes("Ride the Lightning")) return "🚐";
  if (cleanName.includes("Data")) return "🎈";
  if (cleanName.includes("Shelter")) return "🏠";
  return "🎯";
}

export function resolveItem(itemType: string): GameItem {
  const rawId = itemType;
  let cleanId = cleanPrefix(itemType).toLowerCase();

  // --- MANUAL FALLBACK MAP ---
  const FALLBACK_ID_MAP: Record<string, string> = {
    // Evo Mats
    reagent_c_t01: "Pure Drop of Rain",
    reagent_c_t02: "Lightning in a Bottle",
    reagent_c_t03: "Eye of the Storm",
    reagent_c_t04: "Storm Shard",
    // Perk-UPs
    reagent_alteration_upgrade_r: "Rare PERK-UP!",
    reagent_alteration_upgrade_vr: "Epic PERK-UP!",
    reagent_alteration_upgrade_sr: "Legendary PERK-UP!",
    reagent_alteration_generic: "RE-PERK!",
    // XP (Standard)
    heroxp: "Hero XP",
    schematicxp: "Schematic XP",
    personnelxp: "Survivor XP",
    // XP (Underscored)
    hero_xp: "Hero XP",
    schematic_xp: "Schematic XP",
    survivor_xp: "Survivor XP",
  };

  // --- ID NORMALIZATION ---
  if (!RESOURCE_MAP[cleanId] && !FALLBACK_ID_MAP[cleanId]) {
    let tempId = cleanId;
    if (tempId.startsWith("zcp_")) {
      tempId = tempId.replace("zcp_", "");
    }

    // 1. Strip known suffixes
    const suffixes = ["_extreme", "_veryhigh", "_high", "_medium", "_low"];
    for (const suffix of suffixes) {
      if (tempId.endsWith(suffix)) {
        tempId = tempId.substring(0, tempId.length - suffix.length);
        break;
      }
    }

    // 2. CHECK: If we match now (e.g. reagent_c_t01), STOP here.
    if (FALLBACK_ID_MAP[tempId] || RESOURCE_MAP[tempId]) {
      cleanId = tempId;
    } else {
      // 3. If NO match, *then* try stripping _t numbers (fix for heroxp_t26)
      // This prevents breaking reagent_c_t01 which NEEDS the _t01
      tempId = tempId.replace(/_t\d+$/, "");

      if (FALLBACK_ID_MAP[tempId] || RESOURCE_MAP[tempId]) {
        cleanId = tempId;
      }
    }
  }

  const rarity = extractRarity(cleanId);
  let id = cleanId;
  let name = cleanId;
  let type: GameItem["type"] = "unknown";
  let emoji = "📦";

  // --- RESOLUTION LOGIC ---

  const heroMatch = Object.keys(HERO_MAP).find((key) =>
    cleanId.startsWith(key)
  );

  if (heroMatch) {
    type = "hero";
    id = heroMatch;
    name = HERO_MAP[heroMatch].name;
    emoji = RARITY_EMOJIS.hero[rarity] || RARITY_EMOJIS.hero.common;
  } else if (
    cleanId.startsWith("sid_") ||
    cleanId.startsWith("eid_") ||
    cleanId.startsWith("did_")
  ) {
    const weaponMatch = Object.keys(WEAPON_MAP).find((key) =>
      cleanId.startsWith(key)
    );
    const trapMatch = Object.keys(TRAP_MAP).find((key) =>
      cleanId.startsWith(key)
    );

    if (trapMatch) {
      type = "trap";
      id = trapMatch;
      name = TRAP_MAP[trapMatch].name;
      emoji = RARITY_EMOJIS.trap[rarity] || RARITY_EMOJIS.trap.common;
    } else if (weaponMatch) {
      type = "schematic";
      id = weaponMatch;
      name = WEAPON_MAP[weaponMatch].name;
      emoji = RARITY_EMOJIS.schematic[rarity] || RARITY_EMOJIS.schematic.common;
    } else {
      type = "schematic";
      name = "Unknown Schematic";
      emoji = RARITY_EMOJIS.schematic[rarity] || "📜";
    }
  } else {
    // 1. Check Manual Fallback
    if (FALLBACK_ID_MAP[cleanId]) {
      type = "resource";
      name = FALLBACK_ID_MAP[cleanId];
      emoji = STATIC_ICONS[name] || "📦";
    }
    // 2. Check Regular Resource Map
    else if (RESOURCE_MAP[cleanId]) {
      const res = RESOURCE_MAP[cleanId];
      id = cleanId;
      name = res.name;

      if (res.type === "survivor" || res.type === "defender") {
        const isMythic =
          name.includes("Mythic") ||
          rarity === "mythic" ||
          itemType.includes("mythic");
        const finalRarity = isMythic ? "mythic" : rarity;

        if (res.type === "defender") {
          type = "defender";
          emoji =
            RARITY_EMOJIS.defender[finalRarity] ||
            RARITY_EMOJIS.defender.common;
        } else {
          type = "survivor";
          emoji =
            RARITY_EMOJIS.survivor[finalRarity] ||
            RARITY_EMOJIS.survivor.common;
        }
      } else {
        type = "resource";
        emoji = STATIC_ICONS[res.name] || "📦";
      }
    }
    // 3. GENERIC SURVIVOR FALLBACK
    else if (cleanId.includes("worker") || cleanId.includes("manager")) {
      type = "survivor";
      name = cleanId.includes("manager") ? "Lead Survivor" : "Survivor";
      emoji = RARITY_EMOJIS.survivor[rarity] || RARITY_EMOJIS.survivor.common;
    }
    // 4. Check Missions
    else if (MISSION_NAME_MAP[itemType] || itemType.startsWith("Mission_")) {
      type = "mission";
      name = MISSION_NAME_MAP[itemType] || itemType;
      emoji = getMissionEmoji(name);
    }
  }

  // --- FINAL CUSTOM ICON CHECK ---
  if (CUSTOM_ICONS[id]) {
    emoji = CUSTOM_ICONS[id];
  } else {
    const customMatch = Object.keys(CUSTOM_ICONS).find((key) =>
      cleanId.startsWith(key)
    );
    if (customMatch) {
      emoji = CUSTOM_ICONS[customMatch];
    }
  }

  return { id, rawId, name, emoji, rarity, type };
}

export function formatItem(itemType: string): string {
  const item = resolveItem(itemType);
  return `${item.emoji} ${item.name}`;
}
