import type { PrismaClient } from "@/generated/prisma/client";
import type { TeamRosterPlayer } from "@/components/leagues/TeamRosterCard";
import { FantasyProsProvider } from "@/lib/projections/fantasypros/FantasyProsProvider";
import { getCurrentNflSeason, getCurrentNflWeek } from "@/lib/providers/league/sleeper/sleeperUserLookup";
import { getRosterProjectedValues } from "@/lib/valuation/getRosterProjectedValues";

/**
 * Fetches real FantasyPros-derived projected values for one specific roster's players, on
 * demand, when that roster's page is opened — not pre-computed or cached for the whole league.
 * Never lets a projections-fetch failure break the roster page itself: on any error (or if the
 * API key isn't configured), players simply keep the `projectedValue: null` they already have
 * from getTeamRosterView, same as if no projection had been found for them.
 */
export async function attachProjectedValuesToRoster({
  leagueId,
  prisma,
  players,
}: {
  leagueId: string;
  prisma: Pick<PrismaClient, "league">;
  players: TeamRosterPlayer[];
}): Promise<TeamRosterPlayer[]> {
  const apiKey = process.env.FANTASYPROS_API_KEY;
  if (!apiKey) return players;

  try {
    const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
    const scoringSettings = (league.scoringSettings as Record<string, number> | null) ?? {};

    const [currentWeek, season] = await Promise.all([getCurrentNflWeek(), getCurrentNflSeason()]);

    const projectedValueByCanonicalId = await getRosterProjectedValues({
      players: players.map((player) => ({
        canonicalPlayerId: player.canonicalPlayerId,
        name: player.name,
        position: player.position,
        byeWeek: player.byeWeek,
      })),
      scoringSettings,
      currentWeek,
      season,
      projectionsProvider: new FantasyProsProvider(apiKey),
    });

    return players.map((player) => ({
      ...player,
      projectedValue: projectedValueByCanonicalId.get(player.canonicalPlayerId) ?? null,
    }));
  } catch (error) {
    console.error("Failed to fetch roster projected values, showing the roster without them:", error);
    return players;
  }
}
