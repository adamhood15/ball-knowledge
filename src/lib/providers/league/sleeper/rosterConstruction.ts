const BENCH_SLOT_LABEL = "BN";
const BENCH_KEY = "BENCH";

/**
 * Tallies a platform's flat starting-lineup slot list (one entry per slot,
 * repeated for multi-slot positions) into roadmap.md's rosterConstruction
 * shape. Generic over slot names so two-QB/superflex/multi-flex leagues
 * are supported without special-casing any particular layout.
 */
export function rosterPositionSlotsToRosterConstruction(
  rosterPositionSlots: string[],
): Record<string, number> {
  const slotCounts: Record<string, number> = {};

  for (const slot of rosterPositionSlots) {
    const key = slot === BENCH_SLOT_LABEL ? BENCH_KEY : slot;
    slotCounts[key] = (slotCounts[key] ?? 0) + 1;
  }

  return slotCounts;
}
