// Fixed, non-alphabetical display order matching how a real roster reads top to bottom.
export const ROSTER_SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SUPERFLEX", "K", "DEF", "BENCH"];

export function expandRosterConstructionToSlots(rosterConstruction: Record<string, number>): string[] {
  return ROSTER_SLOT_ORDER.flatMap((slot) => Array(rosterConstruction[slot] ?? 0).fill(slot));
}
