// Sleeper reports injury designations as words ("Questionable", "Out"). Fantasy players read
// them as short tags, so the common ones get a fixed abbreviation; anything else falls back to
// the uppercased designation so an unfamiliar status still shows instead of disappearing.
const ABBREVIATED_LABEL_BY_STATUS: Record<string, string> = {
  Questionable: "Q",
  Doubtful: "D",
};

/** Short badge text for a Sleeper injury designation, or null when the player is healthy. */
export function injuryStatusBadgeLabel(injuryStatus: string | null): string | null {
  if (!injuryStatus) return null;
  return ABBREVIATED_LABEL_BY_STATUS[injuryStatus] ?? injuryStatus.toUpperCase();
}
