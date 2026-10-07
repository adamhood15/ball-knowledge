import { afterAll, beforeAll, describe, expect, it } from "vitest";
import playersSubsetFixture from "./__fixtures__/players-subset.json";
import {
  refreshSleeperPlayerCrosswalkIfStale,
  refreshCrosswalkForMissingPlayers,
} from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import type { PlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import { prisma } from "@/lib/prisma";
import type { Player, Prisma } from "@/generated/prisma/client";

function alwaysStaleClock(): PlayerCrosswalkClock {
  return {
    async getLastRefreshedAt() {
      return null;
    },
    async setLastRefreshedAt() {},
  };
}

function fixtureFetch() {
  return (async () => ({
    ok: true,
    status: 200,
    json: async () => playersSubsetFixture,
  })) as unknown as typeof fetch;
}

/**
 * This fixture reuses real Sleeper player IDs for realism, which can collide with rows the
 * routine crosswalk sync has already populated in the shared dev database (e.g. a real player
 * happens to share an ID with a fixture entry). A blanket `deleteMany` on those IDs would
 * permanently destroy that real data every time this suite runs — snapshot before, restore
 * after, so cleanup only ever reverts what the test itself changed.
 */
async function snapshotPlayers(canonicalIds: string[]): Promise<Player[]> {
  return prisma.player.findMany({ where: { canonicalId: { in: canonicalIds } } });
}

async function restorePlayers(canonicalIds: string[], snapshot: Player[]): Promise<void> {
  await prisma.player.deleteMany({ where: { canonicalId: { in: canonicalIds } } });
  if (snapshot.length > 0) {
    await prisma.player.createMany({ data: snapshot as unknown as Prisma.PlayerCreateManyInput[] });
  }
}

describe("refreshSleeperPlayerCrosswalkIfStale (Prisma integration)", () => {
  const seededCanonicalIds = Object.keys(playersSubsetFixture);
  let preExistingPlayers: Player[] = [];

  beforeAll(async () => {
    preExistingPlayers = await snapshotPlayers(seededCanonicalIds);
  });

  afterAll(async () => {
    await restorePlayers(seededCanonicalIds, preExistingPlayers);
    await prisma.$disconnect();
  });

  it(
    "upserts the fixture players into the Player table with expected fields",
    async () => {
      const result = await refreshSleeperPlayerCrosswalkIfStale({
        clock: alwaysStaleClock(),
        prisma,
        fetchImpl: fixtureFetch(),
        now: new Date(),
      });

      expect(result.refreshed).toBe(true);
      expect(result.playersUpserted).toBe(seededCanonicalIds.length);

      const jamesConner = await prisma.player.findUniqueOrThrow({ where: { canonicalId: "4137" } });
      expect(jamesConner.name).toBe("James Conner");
      expect(jamesConner.position).toBe("RB");
      expect(jamesConner.nflTeam).toBe("ARI");
      expect(jamesConner.platformIdCrosswalk).toEqual({ sleeper: "4137" });
    },
    20000,
  );

  it(
    "is idempotent: re-running the refresh updates rather than duplicates rows",
    async () => {
      await refreshSleeperPlayerCrosswalkIfStale({
        clock: alwaysStaleClock(),
        prisma,
        fetchImpl: fixtureFetch(),
        now: new Date(),
      });

      const playerCount = await prisma.player.count({ where: { canonicalId: { in: seededCanonicalIds } } });
      expect(playerCount).toBe(seededCanonicalIds.length);
    },
    20000,
  );
});

describe("refreshCrosswalkForMissingPlayers (Prisma integration)", () => {
  const targetCanonicalId = Object.keys(playersSubsetFixture)[0]!;
  let preExistingPlayers: Player[] = [];

  beforeAll(async () => {
    preExistingPlayers = await snapshotPlayers([targetCanonicalId]);
  });

  afterAll(async () => {
    await restorePlayers([targetCanonicalId], preExistingPlayers);
    await prisma.$disconnect();
  });

  it(
    "upserts only the requested player out of the whole fetched list",
    async () => {
      // The other fixture ID may or may not already exist for real (fixture IDs are real
      // Sleeper IDs, and the shared dev database's routine crosswalk sync could easily have
      // a real player at that ID) — the invariant this call must satisfy is "didn't touch it
      // either way," not "it doesn't exist," so snapshot before and compare after rather than
      // asserting non-existence.
      const otherFixtureCanonicalId = Object.keys(playersSubsetFixture)[1]!;
      const otherPlayerBefore = await prisma.player.findUnique({ where: { canonicalId: otherFixtureCanonicalId } });

      const result = await refreshCrosswalkForMissingPlayers({
        prisma,
        canonicalPlayerIds: [targetCanonicalId],
        fetchImpl: fixtureFetch(),
      });

      expect(result.playersUpserted).toBe(1);
      const player = await prisma.player.findUniqueOrThrow({ where: { canonicalId: targetCanonicalId } });
      expect(player.canonicalId).toBe(targetCanonicalId);

      const otherPlayerAfter = await prisma.player.findUnique({ where: { canonicalId: otherFixtureCanonicalId } });
      expect(otherPlayerAfter).toEqual(otherPlayerBefore);
    },
    20000,
  );
});
