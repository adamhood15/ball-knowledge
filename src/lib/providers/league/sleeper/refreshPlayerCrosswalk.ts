import type { PrismaClient } from "@/generated/prisma/client";
import { isPlayerCrosswalkStale, type PlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";

const SLEEPER_PLAYER_LIST_URL = "https://api.sleeper.app/v1/players/nfl";
const UPSERT_BATCH_SIZE = 25;

interface SleeperPlayerResponse {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  team?: string | null;
}

type FetchImpl = (url: string) => Promise<Response>;

function playerDisplayName(player: SleeperPlayerResponse): string {
  if (player.full_name) return player.full_name;
  return [player.first_name, player.last_name].filter(Boolean).join(" ");
}

async function fetchFantasyRelevantSleeperPlayers(fetchImpl: FetchImpl): Promise<SleeperPlayerResponse[]> {
  const response = await fetchImpl(SLEEPER_PLAYER_LIST_URL);
  if (!response.ok) {
    throw new Error(`Sleeper player list request failed with status ${response.status}`);
  }
  const playersById: Record<string, SleeperPlayerResponse> = await response.json();
  return Object.values(playersById).filter((player) => player.position);
}

async function upsertPlayers(
  prisma: Pick<PrismaClient, "player">,
  players: SleeperPlayerResponse[],
): Promise<void> {
  for (let batchStart = 0; batchStart < players.length; batchStart += UPSERT_BATCH_SIZE) {
    const batch = players.slice(batchStart, batchStart + UPSERT_BATCH_SIZE);
    await Promise.all(
      batch.map((player) => {
        const displayName = playerDisplayName(player);
        return prisma.player.upsert({
          where: { canonicalId: player.player_id },
          create: {
            canonicalId: player.player_id,
            name: displayName,
            normalizedName: normalizePlayerName(displayName),
            position: player.position!,
            nflTeam: player.team ?? null,
            platformIdCrosswalk: { sleeper: player.player_id },
          },
          update: {
            name: displayName,
            normalizedName: normalizePlayerName(displayName),
            position: player.position!,
            nflTeam: player.team ?? null,
            platformIdCrosswalk: { sleeper: player.player_id },
          },
        });
      }),
    );
  }
}

export async function refreshSleeperPlayerCrosswalkIfStale({
  clock,
  prisma,
  fetchImpl = fetch,
  now = new Date(),
}: {
  clock: PlayerCrosswalkClock;
  prisma: Pick<PrismaClient, "player">;
  fetchImpl?: FetchImpl;
  now?: Date;
}): Promise<{ refreshed: boolean; playersUpserted: number }> {
  const lastRefreshedAt = await clock.getLastRefreshedAt();
  if (!isPlayerCrosswalkStale(lastRefreshedAt, now)) {
    return { refreshed: false, playersUpserted: 0 };
  }

  const fantasyRelevantPlayers = await fetchFantasyRelevantSleeperPlayers(fetchImpl);
  await upsertPlayers(prisma, fantasyRelevantPlayers);

  await clock.setLastRefreshedAt(now);
  return { refreshed: true, playersUpserted: fantasyRelevantPlayers.length };
}

/**
 * Resolves a specific, known-missing set of players without touching the routine daily
 * refresh's clock — this is a correctness patch for one roster's view, not the full crosswalk
 * sync, so it must stay cheap (a handful of upserts) rather than upserting Sleeper's entire
 * ~12k-player list, which is what made roster pages slow to load before this fix.
 */
export async function refreshCrosswalkForMissingPlayers({
  prisma,
  canonicalPlayerIds,
  fetchImpl = fetch,
}: {
  prisma: Pick<PrismaClient, "player">;
  canonicalPlayerIds: string[];
  fetchImpl?: FetchImpl;
}): Promise<{ playersUpserted: number }> {
  if (canonicalPlayerIds.length === 0) return { playersUpserted: 0 };

  const requestedIds = new Set(canonicalPlayerIds);
  const fantasyRelevantPlayers = await fetchFantasyRelevantSleeperPlayers(fetchImpl);
  const playersToUpsert = fantasyRelevantPlayers.filter((player) => requestedIds.has(player.player_id));

  await upsertPlayers(prisma, playersToUpsert);

  return { playersUpserted: playersToUpsert.length };
}

/**
 * Guarantees a roster's players resolve to real names before display. The routine daily
 * refresh is deliberately staleness-gated per Sleeper's guidance, but if a roster view finds
 * a player missing from the crosswalk (e.g. it hasn't run yet, or a rookie was added mid-day),
 * that's a correctness gap worth fixing immediately — never show "Unknown player" when a fresh
 * fetch would fix it. Only the missing players are fetched/upserted, not the entire list.
 */
export async function ensurePlayersResolvable({
  prisma,
  canonicalPlayerIds,
  fetchImpl = fetch,
}: {
  prisma: Pick<PrismaClient, "player">;
  canonicalPlayerIds: string[];
  fetchImpl?: FetchImpl;
}): Promise<void> {
  if (canonicalPlayerIds.length === 0) return;

  const existingPlayers = await prisma.player.findMany({
    where: { canonicalId: { in: canonicalPlayerIds } },
    select: { canonicalId: true },
  });
  const existingIds = new Set(existingPlayers.map((player) => player.canonicalId));
  const missingCanonicalPlayerIds = canonicalPlayerIds.filter((id) => !existingIds.has(id));
  if (missingCanonicalPlayerIds.length === 0) return;

  await refreshCrosswalkForMissingPlayers({ prisma, canonicalPlayerIds: missingCanonicalPlayerIds, fetchImpl });
}
