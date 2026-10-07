import type { ProjectionsProvider } from "@/lib/projections/ProjectionsProvider";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";
import { getPlayerProjectedValue } from "@/lib/valuation/getPlayerProjectedValue";

export interface RosterPlayerForValuation {
  canonicalPlayerId: string;
  name: string | null;
  position: string | null;
  byeWeek: number | null;
}

/**
 * Resolves real projected values for a specific roster's players only, fetched fresh on each
 * call rather than pre-computed for the whole league — this is meant to be called from a roster
 * page's server component, on demand, when a user actually opens that roster.
 *
 * FantasyPros' free tier only samples the top ~10 players per position league-wide (see
 * FantasyProsProvider.ts), so most roster players won't have a match yet — those are simply
 * omitted from the returned map rather than erroring; the caller treats "missing" as "no
 * projection available."
 */
export async function getRosterProjectedValues({
  players,
  scoringSettings,
  currentWeek,
  season,
  projectionsProvider,
}: {
  players: RosterPlayerForValuation[];
  scoringSettings: Record<string, number>;
  currentWeek: number;
  season: string;
  projectionsProvider: ProjectionsProvider;
}): Promise<Map<string, number>> {
  const projections = await projectionsProvider.getSeasonProjections(season);
  const projectionByNormalizedName = new Map(
    projections.map((projection) => [normalizePlayerName(projection.name), projection]),
  );

  const projectedValueByCanonicalId = new Map<string, number>();

  for (const player of players) {
    if (!player.name) continue;
    const projection = projectionByNormalizedName.get(normalizePlayerName(player.name));
    if (!projection) continue;

    const value = getPlayerProjectedValue({
      statLine: projection.statLine,
      scoringSettings,
      position: player.position ?? projection.position,
      currentWeek,
      byeWeek: player.byeWeek,
      injuryRisk: projection.injuryRisk,
    });
    projectedValueByCanonicalId.set(player.canonicalPlayerId, value);
  }

  return projectedValueByCanonicalId;
}
