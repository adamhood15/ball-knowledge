import { afterAll, describe, expect, it } from "vitest";
import playersSubsetFixture from "./__fixtures__/players-subset.json";
import { refreshSleeperPlayerCrosswalkIfStale } from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import type { PlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import { prisma } from "@/lib/prisma";

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

describe("refreshSleeperPlayerCrosswalkIfStale (Prisma integration)", () => {
  const seededCanonicalIds = Object.keys(playersSubsetFixture);

  afterAll(async () => {
    await prisma.player.deleteMany({ where: { canonicalId: { in: seededCanonicalIds } } });
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
