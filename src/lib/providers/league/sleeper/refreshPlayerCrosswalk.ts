import type { PrismaClient } from "@/generated/prisma/client";
import { isPlayerCrosswalkStale, type PlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";

const SLEEPER_PLAYER_LIST_URL = "https://api.sleeper.app/v1/players/nfl";

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

  const response = await fetchImpl(SLEEPER_PLAYER_LIST_URL);
  if (!response.ok) {
    throw new Error(`Sleeper player list request failed with status ${response.status}`);
  }
  const playersById: Record<string, SleeperPlayerResponse> = await response.json();
  const fantasyRelevantPlayers = Object.values(playersById).filter((player) => player.position);

  const upsertBatchSize = 25;
  for (let batchStart = 0; batchStart < fantasyRelevantPlayers.length; batchStart += upsertBatchSize) {
    const batch = fantasyRelevantPlayers.slice(batchStart, batchStart + upsertBatchSize);
    await Promise.all(
      batch.map((player) =>
        prisma.player.upsert({
          where: { canonicalId: player.player_id },
          create: {
            canonicalId: player.player_id,
            name: playerDisplayName(player),
            position: player.position!,
            nflTeam: player.team ?? null,
            platformIdCrosswalk: { sleeper: player.player_id },
          },
          update: {
            name: playerDisplayName(player),
            position: player.position!,
            nflTeam: player.team ?? null,
            platformIdCrosswalk: { sleeper: player.player_id },
          },
        }),
      ),
    );
  }

  await clock.setLastRefreshedAt(now);
  return { refreshed: true, playersUpserted: fantasyRelevantPlayers.length };
}

/**
 * Guarantees a roster's players resolve to real names before display. The routine daily
 * refresh (above) is deliberately staleness-gated per Sleeper's guidance, but if a roster
 * view finds a player missing from the crosswalk (e.g. it hasn't run yet, or a rookie was
 * added mid-day), that's a correctness gap worth bypassing the gate for — never show
 * "Unknown player" when a fresh fetch would fix it.
 */
export async function ensurePlayersResolvable({
  clock,
  prisma,
  canonicalPlayerIds,
  fetchImpl = fetch,
  now = new Date(),
}: {
  clock: PlayerCrosswalkClock;
  prisma: Pick<PrismaClient, "player">;
  canonicalPlayerIds: string[];
  fetchImpl?: FetchImpl;
  now?: Date;
}): Promise<void> {
  if (canonicalPlayerIds.length === 0) return;

  const existingPlayers = await prisma.player.findMany({
    where: { canonicalId: { in: canonicalPlayerIds } },
    select: { canonicalId: true },
  });
  const existingIds = new Set(existingPlayers.map((player) => player.canonicalId));
  const hasMissingPlayers = canonicalPlayerIds.some((id) => !existingIds.has(id));
  if (!hasMissingPlayers) return;

  await refreshSleeperPlayerCrosswalkIfStale({
    clock: { getLastRefreshedAt: async () => null, setLastRefreshedAt: clock.setLastRefreshedAt },
    prisma,
    fetchImpl,
    now,
  });
}
