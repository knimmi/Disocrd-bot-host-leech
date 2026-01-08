/**
 * --- Emoji Mappings ---
 */

export const REWARD_EMOJIS = {
  UC_PERK: "<:ucperk:1458453604787552362>",
  C_PERK: "<:cperk:1458453583392673853>",
  MINI_LLAMA: "<:ml:1458495881878831258>",
  RE_PERK: "<:reperk:1458176552855670836>",
  EYE: "<:eye:1457763941051797708>",
  SHARD: "<:shard:1457763923397709946>",
  LIAB: "<:liab:1457763908248010927>",
  PDOR: "<:pdor:1457763893509230622>",
  SURVIVOR: "<:surv:1458442238185967830>",
  TRAINING_MANUAL: "<:pmanual:1458441804813963274>",
  WEAPON_DESIGN: "<:mmanuals:1458441788749516862>",
  TRAP_DESIGN: "<:tmanuals:1458441775231402076>",
  XRAY_TICKET: "<:rickets:1458179312883601428>",
  FIRE_UP: "<:fireup:1458177350570217472>",
  ICE_UP: "<:iceup:1458177333033697543>",
  AMP_UP: "<:ampup:1458177320933130271>",
  VENTURE_XP: "<:ventxp:1458176649131462686>",
  GOLD: "<:gold:1458176540130017363>",
  TICKET_SUMMER: "<:tsummer:1458176630101905561>",
  TICKET_SPRING: "<:tspring:1458176610028224513>",
  TICKET_HTR: "<:thtr:1458176593900867687>",
  TICKET_FROST: "<:tfrost:1458176574879694948>",
  VBUCKS: "<:vbucks:1457696912621834436>",
  SURVIVOR_XP: "<:suxp:1457764500081217627>",
  HERO_XP: "<:heroxp:1457764481835995228>",
  SCHEMATIC_XP: "<:ruben:1457764464609726587>",
  LEG_PERK: "<:lp:1457763973784146013>",
  EPIC_PERK: "<:ep:1457763879055786026>",
  MYTHIC: "🌟",
  CLUB: "<:driver:1457711561756901409>",
  BAT: "<:slugger:1457711578404098089>",
  KNOX: "👷",
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

export const MYTHIC_LEAD_IDENTIFIERS = new Set([
  "managerdoctor_sr_kingsly",
  "managerdoctor_sr_noctor",
  "managerdoctor_sr_treky",
  "managerengineer_sr_countess",
  "managerengineer_sr_maths",
  "managerengineer_sr_sobs",
  "managerexplorer_sr_birdie",
  "managerexplorer_sr_eagle",
  "managerexplorer_sr_spacebound",
  "managergadgeteer_sr_fixer",
  "managergadgeteer_sr_flak",
  "managergadgeteer_sr_zapps",
  "managerinventor_sr_frequency",
  "managerinventor_sr_rad",
  "managerinventor_sr_square",
  "managermartialartist_sr_dragon",
  "managermartialartist_sr_samurai",
  "managermartialartist_sr_tiger",
  "managersoldier_sr_malcolm",
  "managersoldier_sr_princess",
  "managersoldier_sr_ramsie",
  "managertrainer_sr_jumpy",
  "managertrainer_sr_raider",
  "managertrainer_sr_yoglattes",
]);

const MISSION_NAME_MAP: Record<string, keyof typeof MISSION_EMOJIS> = {
  // Atlases
  Cat1FtS: "CAT1",
  GateSingle: "CAT1",
  "1Gate": "CAT1",
  Cat2FtS: "CAT2",
  "2Gates": "CAT2",
  Cat3FtS: "CAT3",
  "3Gates": "CAT3",
  Cat4FtS: "CAT4",
  "4Gates": "CAT4",
  // Bomb
  DtB: "DTB",
  DeliverTheBomb: "DTB",
  // Encampments
  DtE: "ENCAMPMENTS",
  DestroyTheEncampments: "ENCAMPMENTS",
  // Eliminate
  EliminateAndCollect: "ELIMINATE",
  // Evacuate
  EtS_C: "EVACUATE",
  EtShelter: "EVACUATE",
  // Rescue
  EvacuateTheSurvivors: "RESCUE",
  EtSurvivors: "RESCUE",
  // Radar
  BuildtheRadarGrid: "RADAR",
  BuildTheRadar: "RADAR",
  // Refuel
  RefuelTheBase: "REFUEL",
  FuelTheHomebase: "REFUEL",
  // Resupply
  Resupply: "RESUPPLY",
  // HTM
  HTM: "HTM",
  HuntTheTitan: "HTM",
  // Rocket
  LtR: "LTR",
  LaunchTheRocket: "LTR",
  // RtD
  RtD: "RTD",
  RetrieveTheData: "RTD",
  // RtL
  RtL: "RTL",
  LtB: "RTL",
  T1_VHT_LtB: "RTL",
  LaunchTheBalloon: "RTL",
  RideTheLightning: "RTL",
  // Repair
  RtS: "REPAIR",
  PowerTheStormShield: "REPAIR",
  RepairTheShelter: "REPAIR",
  // Fallbacks
  Dudebro: "MSK",
};

const WORLD_POWER_LEVEL: Record<string, Record<string, number>> = {
  "33A2311D4AE64B361CCE27BC9F313C8B": {
    Start_Zone1: 1,
    Start_Zone2: 3,
    Start_Zone3: 5,
    Start_Zone4: 9,
    Start_Zone5: 15,
    Normal_Zone1: 19,
  },
  D477605B4FA48648107B649CE97FCF27: {
    Normal_Zone1: 19,
    Normal_Zone2: 23,
    Normal_Zone3: 28,
    Normal_Zone4: 34,
    Normal_Zone5: 40,
    Hard_Zone1: 46,
  },
  E6ECBD064B153234656CB4BDE6743870: {
    Hard_Zone1: 46,
    Hard_Zone2: 52,
    Hard_Zone3: 58,
    Hard_Zone4: 64,
    Hard_Zone5: 70,
  },
  D9A801C5444D1C74D1B7DAB5C7C12C5B: {
    Nightmare_Zone1: 76,
    Nightmare_Zone2: 82,
    Nightmare_Zone3: 88,
    Nightmare_Zone4: 94,
    Nightmare_Zone5: 100,
    Endgame_Zone1: 108,
    Endgame_Zone2: 116,
    Endgame_Zone3: 124,
    Endgame_Zone4: 132,
    Endgame_Zone5: 140,
    Endgame_Zone6: 160,
  },
  D61659064BED28BEA91FD2A343C126B7: {
    Phoenix_Zone02: 3,
    Phoenix_Zone03: 5,
    Phoenix_Zone05: 15,
    Phoenix_Zone07: 23,
    Phoenix_Zone09: 34,
    Phoenix_Zone11: 46,
    Phoenix_Zone13: 58,
    Phoenix_Zone15: 70,
    Phoenix_Zone17: 82,
    Phoenix_Zone19: 94,
    Phoenix_Zone21: 108,
    Phoenix_Zone23: 124,
    Phoenix_Zone25: 140,
  },

  MSK_FALLBACK: {
    Hard_Zone5_Dudebro: 122,
  },
};

/**
 * --- Helper Functions ---
 */

export function getPLFromRowName(theaterId: string, rowName: string): string {
  if (!rowName) return "??";

  // This strips "Theater_" AND "_Group_" to match mapping keys
  const cleanRow = rowName.replace(/^Theater_/, "").replace("_Group_", "_");
  const theaterMap = WORLD_POWER_LEVEL[theaterId];
  if (theaterMap && theaterMap[cleanRow]) {
    return theaterMap[cleanRow].toString();
  }

  // Fallback: search all theaters for the row name
  for (const id in WORLD_POWER_LEVEL) {
    if (WORLD_POWER_LEVEL[id][cleanRow]) {
      return WORLD_POWER_LEVEL[id][cleanRow].toString();
    }
  }

  return "??";
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("nl-NL").format(num);
}

export function getMissionEmoji(generatorPath: string): string {
  const key = Object.keys(MISSION_NAME_MAP).find((k) =>
    generatorPath.includes(k)
  );
  if (!key) return "❓";
  return MISSION_EMOJIS[MISSION_NAME_MAP[key]] || "❓";
}

export function getItemEmoji(itemType: string): string {
  const rawType = itemType.toLowerCase();
  const type = rawType.split(":").pop() || "";

  // 1. Currencies & XP (MOVED UP to prevent "schematicxp" from being caught as a Manual)
  if (type.includes("currency_mtxswap")) return REWARD_EMOJIS.VBUCKS;
  if (type.includes("phoenixxp")) return REWARD_EMOJIS.VENTURE_XP;
  if (type.includes("personnelxp")) return REWARD_EMOJIS.SURVIVOR_XP;
  if (type.includes("heroxp")) return REWARD_EMOJIS.HERO_XP;
  if (type.includes("schematicxp")) return REWARD_EMOJIS.SCHEMATIC_XP; // Now it will find this first!
  if (type.includes("scaling") || type.includes("gold"))
    return REWARD_EMOJIS.GOLD;
  if (type.includes("currency_xrayllama")) return REWARD_EMOJIS.XRAY_TICKET;

  // 2. Mythic Leads
  if (
    MYTHIC_LEAD_IDENTIFIERS.has(type) ||
    (type.includes("manager") && type.includes("_sr_"))
  ) {
    return REWARD_EMOJIS.MYTHIC;
  }

  // 3. Perk-ups and Evolution
  if (type.includes("reagent_c_t03")) return REWARD_EMOJIS.EYE;
  if (type.includes("reagent_c_t04")) return REWARD_EMOJIS.SHARD;
  if (type.includes("reagent_c_t02")) return REWARD_EMOJIS.LIAB;
  if (type.includes("reagent_c_t01")) return REWARD_EMOJIS.PDOR;
  if (type.includes("reagent_alteration_upgrade_uc"))
    return REWARD_EMOJIS.UC_PERK;
  if (type.includes("reagent_alteration_upgrade_r"))
    return REWARD_EMOJIS.C_PERK;
  if (type.includes("reagent_alteration_upgrade_vr"))
    return REWARD_EMOJIS.EPIC_PERK;
  if (type.includes("reagent_alteration_upgrade_sr"))
    return REWARD_EMOJIS.LEG_PERK;
  if (type.includes("reagent_alteration_generic")) return REWARD_EMOJIS.RE_PERK;

  // 4. Elemental Ups
  if (type.includes("ele_fire")) return REWARD_EMOJIS.FIRE_UP;
  if (type.includes("ele_water")) return REWARD_EMOJIS.ICE_UP;
  if (type.includes("ele_nature")) return REWARD_EMOJIS.AMP_UP;

  // 5. Tickets & Card Packs
  if (type.includes("voucher_basicpack")) return REWARD_EMOJIS.MINI_LLAMA;
  if (
    type.includes("eventcurrency") ||
    type.includes("summer") ||
    type.includes("spring") ||
    type.includes("snowballs") ||
    type.includes("snowflake") ||
    type.includes("roadtrip") ||
    type.includes("adventure") ||
    type.includes("campaign_event_currency")
  ) {
    return "<a:rickets:1458179312883601428>";
  }

  // 6. Heroes & People
  if (
    type.startsWith("hid_") ||
    type.startsWith("cid_") ||
    type.includes("reagent_people") ||
    type.includes("did_defender")
  ) {
    return REWARD_EMOJIS.TRAINING_MANUAL;
  }

  // 7. Schematics (Weapons/Traps)
  if (rawType.includes("sid_blunt_club_light")) return REWARD_EMOJIS.CLUB;
  if (rawType.includes("sid_blunt_light_rocketbat")) return REWARD_EMOJIS.BAT;
  if (rawType.includes("hid_constructor_008")) return REWARD_EMOJIS.KNOX;

  if (
    type.includes("sid_floor_") ||
    type.includes("sid_wall_") ||
    type.includes("sid_ceiling_")
  )
    return REWARD_EMOJIS.TRAP_DESIGN;

  // This will now only trigger for actual weapon/trap schematics
  if (
    type.includes("sid_") ||
    type.includes("weapon_") ||
    type.includes("schematic")
  )
    return REWARD_EMOJIS.WEAPON_DESIGN;

  if (type.includes("workerbasic_") || type.includes("survivor"))
    return REWARD_EMOJIS.SURVIVOR;

  if (type.includes("reagent_weapons")) return REWARD_EMOJIS.WEAPON_DESIGN;
  if (type.includes("reagent_traps")) return REWARD_EMOJIS.TRAP_DESIGN;

  return "📦";
}

export function formatReward(itemType: string, quantity: number): string {
  return `${formatNumber(quantity)} ${getItemEmoji(itemType)}`;
}
