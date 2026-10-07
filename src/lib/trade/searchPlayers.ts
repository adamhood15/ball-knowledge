import type { PrismaClient } from "@/generated/prisma/client";
import { FANTASY_RELEVANT_POSITIONS } from "@/lib/leagueSettings/fantasyPositions";

const DEFAULT_SEARCH_LIMIT = 8;
const MINIMUM_QUERY_LENGTH = 2;

export interface PlayerSearchResult {
  canonicalPlayerId: string;
  name: string;
  position: string;
  nflTeam: string | null;
}

interface RosterSnapshotPlayer {
  canonicalPlayerId: string;
}

async function leagueRosteredPlayerIds({
  prisma,
  leagueId,
}: {
  prisma: Pick<PrismaClient, "team" | "roster">;
  leagueId: string;
}): Promise<Set<string>> {
  const teams = await prisma.team.findMany({ where: { leagueId }, select: { id: true } });
  const latestRosters = await Promise.all(
    teams.map((team) => prisma.roster.findFirst({ where: { teamId: team.id }, orderBy: { snapshotAt: "desc" } })),
  );

  const canonicalPlayerIds = new Set<string>();
  for (const roster of latestRosters) {
    const rosterPlayers = (roster?.players as unknown as RosterSnapshotPlayer[] | undefined) ?? [];
    for (const rosterPlayer of rosterPlayers) canonicalPlayerIds.add(rosterPlayer.canonicalPlayerId);
  }
  return canonicalPlayerIds;
}

/**
 * Player search for the trade builder's live search-as-you-type field. Scoped to a league's
 * actual rostered players when leagueId is given (so suggestions are relevant to that league),
 * or searches every crosswalked player when it isn't (the "custom settings" trade flow, which
 * has no league/roster context to scope to).
 */
export async function searchPlayers({
  prisma,
  query,
  leagueId,
  limit = DEFAULT_SEARCH_LIMIT,
}: {
  prisma: Pick<PrismaClient, "player" | "team" | "roster">;
  query: string;
  leagueId?: string;
  limit?: number;
}): Promise<PlayerSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < MINIMUM_QUERY_LENGTH) return [];

  let canonicalPlayerIdFilter: Set<string> | null = null;
  if (leagueId) {
    canonicalPlayerIdFilter = await leagueRosteredPlayerIds({ prisma, leagueId });
    if (canonicalPlayerIdFilter.size === 0) return [];
  }

  const players = await prisma.player.findMany({
    where: {
      name: { contains: trimmedQuery, mode: "insensitive" },
      position: { in: FANTASY_RELEVANT_POSITIONS },
      active: true,
      ...(canonicalPlayerIdFilter ? { canonicalId: { in: [...canonicalPlayerIdFilter] } } : {}),
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return players.map((player) => ({
    canonicalPlayerId: player.canonicalId,
    name: player.name,
    position: player.position,
    nflTeam: player.nflTeam,
  }));
}
