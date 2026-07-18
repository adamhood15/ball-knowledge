import { sleeperHeadshotUrl } from "@/lib/providers/league/sleeper/headshotUrl";
import { sleeperTeamLogoUrl } from "@/lib/providers/league/sleeper/teamLogoUrl";

/**
 * Sleeper represents a team defense as a "player" whose ID is the NFL team abbreviation
 * (e.g. "KC") rather than a numeric player ID — there's no per-player headshot for that ID,
 * only a team logo at a separate CDN path, so DEF entries need a different image URL.
 */
export function playerImageUrl(player: { canonicalPlayerId: string; position: string | null }): string {
  if (player.position === "DEF") return sleeperTeamLogoUrl(player.canonicalPlayerId);
  return sleeperHeadshotUrl(player.canonicalPlayerId);
}
