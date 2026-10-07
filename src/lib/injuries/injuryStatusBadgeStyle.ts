const SOLID_RED_CLASSES = "bg-red-600 text-white border-red-600";
const SOLID_YELLOW_CLASSES = "bg-yellow-400 text-background border-yellow-400";
const NEUTRAL_CLASSES = "bg-transparent text-body-text border-muted-text/30";

// Designations where the player is not expected to play at all.
const RED_STATUSES = new Set(["Out", "IR"]);
// Designations where the player may or may not play, so they stay visibly flagged but not as out.
const YELLOW_STATUSES = new Set(["Questionable", "Doubtful"]);

/**
 * Tailwind classes for a Sleeper injury designation's badge: solid red for Out/IR, solid yellow
 * for Questionable/Doubtful, and the neutral static box for anything else.
 */
export function injuryStatusBadgeClasses(injuryStatus: string | null): string {
  if (injuryStatus === null) return NEUTRAL_CLASSES;
  if (RED_STATUSES.has(injuryStatus)) return SOLID_RED_CLASSES;
  if (YELLOW_STATUSES.has(injuryStatus)) return SOLID_YELLOW_CLASSES;
  return NEUTRAL_CLASSES;
}
