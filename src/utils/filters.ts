import { MYTHIC_LEAD_IDENTIFIERS, RESOURCE_MAP } from "./maps.js";
import { resolveItem, GameItem } from "./itemUtils.js";

/**
 * Checks if a mission is a 160 Zone.
 */
export function is160Mission(plString: string): boolean {
  // Loose equality handles if input is "160" (string) or 160 (number)
  return plString == "160";
}

/**
 * Checks if an item is V-Bucks.
 */
export function isVBucks(itemType: string): boolean {
  return itemType.toLowerCase().includes("currency_mtxswap");
}

/**
 * Filter 160 Rewards: Hides ONLY Gold.
 * Everything else (XP, Manuals, Tickets, Superchargers) will be shown.
 */
export function filter160Rewards(items: any[]): any[] {
  // Gold is identified by these internal names
  const IGNORED_TERMS = ["eventcurrency_scaling", "eventscaling"];

  return items.filter((i: any) => {
    const type = i.itemType.toLowerCase();
    // Return true only if the item does NOT contain Gold terms
    return !IGNORED_TERMS.some((term) => type.includes(term));
  });
}

/**
 * Aggregates duplicate rewards in a list.
 * Example: if a mission drops 80x PerkUp and 65x PerkUp, this returns one entry of 145x PerkUp.
 */
export function aggregateRewards(items: any[]): any[] {
  const map = new Map<string, any>();

  for (const item of items) {
    const key = item.itemType;
    if (map.has(key)) {
      const existing = map.get(key);
      existing.quantity += item.quantity;
    } else {
      // Clone the object so we don't mutate the original
      map.set(key, { ...item });
    }
  }

  return Array.from(map.values());
}

/**
 * Helper: Logic for specific filter categories using the resolved item.
 */
function matchesCategory(filterValue: string, item: GameItem): boolean {
  const val = filterValue.toLowerCase();

  switch (val) {
    case "filter_mythic_lead":
      // Check strict ID set OR resolved attributes
      return (
        MYTHIC_LEAD_IDENTIFIERS.has(item.id) ||
        (item.type === "survivor" && item.rarity === "mythic") ||
        (item.name.toLowerCase().includes("manager") &&
          item.name.toLowerCase().includes("_sr"))
      );

    case "filter_leg_schematic":
      // Check resolved type OR raw string fallback
      return (
        (item.type === "schematic" && item.rarity === "legendary") ||
        (item.rawId.includes("sid_") && item.rawId.includes("_sr"))
      );

    case "filter_leg_hero":
      // Check resolved type OR raw string fallback
      return (
        (item.type === "hero" && item.rarity === "legendary") ||
        (item.rawId.includes("hero") && item.rawId.includes("_sr")) ||
        (item.rawId.includes("hid_") && item.rawId.includes("_sr"))
      );

    case "currency_mtxswap":
      return item.rawId.toLowerCase().includes("currency_mtxswap");

    case "filter_160":
      // Always match because the command handles the specific logic for 160s
      return true;

    default:
      return false;
  }
}

/**
 * MASTER FILTER CHECK
 * @param itemType The raw item string from API
 * @param filterValue The user's selected dropdown value
 */
export function checkRewardMatch(
  itemType: string,
  filterValue: string
): boolean {
  if (!itemType) return false;

  // 1. Resolve the item ONCE at the start.
  const item = resolveItem(itemType);
  const val = filterValue.toLowerCase();

  // 2. Check strict category filters
  if (val.startsWith("filter_") || val === "currency_mtxswap") {
    return matchesCategory(val, item);
  }

  // 3. Generic Search (Name, Type, or ID match)
  const cleanFilter = val.replace("filter_", "");

  // Check exact ID match (Partial)
  if (item.id.toLowerCase().includes(cleanFilter)) return true;

  // Check Display Name match
  if (item.name.toLowerCase().includes(cleanFilter)) return true;

  // Check Raw ID (Backup)
  if (item.rawId.toLowerCase().includes(cleanFilter)) return true;

  // Check Resource Type (e.g. searching "evo" finds all evolution mats)
  const resInfo = RESOURCE_MAP[item.id];
  if (resInfo && resInfo.type === cleanFilter) return true;

  return false;
}
