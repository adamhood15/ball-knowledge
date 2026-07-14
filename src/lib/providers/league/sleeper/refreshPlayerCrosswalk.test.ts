import { describe, expect, it, vi } from "vitest";
import playersSubsetFixture from "./__fixtures__/players-subset.json";
import {
  ensurePlayersResolvable,
  refreshSleeperPlayerCrosswalkIfStale,
} from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import type { PlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";

function fakeClock(lastRefreshedAt: Date | null): PlayerCrosswalkClock & { setLastRefreshedAtCalls: Date[] } {
  const setLastRefreshedAtCalls: Date[] = [];
  return {
    setLastRefreshedAtCalls,
    async getLastRefreshedAt() {
      return lastRefreshedAt;
    },
    async setLastRefreshedAt(at: Date) {
      setLastRefreshedAtCalls.push(at);
    },
  };
}

function fakeFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => playersSubsetFixture,
  })) as unknown as typeof fetch;
}

function fakePlayerUpsertClient(existingCanonicalIds: string[] = []) {
  const upsertCalls: unknown[] = [];
  return {
    upsertCalls,
    player: {
      async upsert(args: unknown) {
        upsertCalls.push(args);
      },
      async findMany({ where }: { where: { canonicalId: { in: string[] } } }) {
        return where.canonicalId.in
          .filter((id) => existingCanonicalIds.includes(id))
          .map((canonicalId) => ({ canonicalId }));
      },
    },
  };
}

describe("refreshSleeperPlayerCrosswalkIfStale", () => {
  it("skips the network call and upserts when the crosswalk is not stale", async () => {
    const clock = fakeClock(new Date());
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient();

    const result = await refreshSleeperPlayerCrosswalkIfStale({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      fetchImpl,
      now: new Date(),
    });

    expect(result.refreshed).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(prisma.upsertCalls).toHaveLength(0);
  });

  it("fetches and upserts every fantasy-relevant player when the crosswalk is stale, then updates the clock", async () => {
    const clock = fakeClock(null);
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient();
    const now = new Date("2026-07-13T12:00:00Z");

    const result = await refreshSleeperPlayerCrosswalkIfStale({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      fetchImpl,
      now,
    });

    expect(result.refreshed).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.sleeper.app/v1/players/nfl");
    expect(prisma.upsertCalls.length).toBe(result.playersUpserted);
    expect(prisma.upsertCalls.length).toBeGreaterThan(0);
    expect(clock.setLastRefreshedAtCalls).toEqual([now]);
  });
});

describe("ensurePlayersResolvable", () => {
  it("does nothing when every requested player is already crosswalked", async () => {
    const clock = fakeClock(new Date());
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient(["100", "200"]);

    await ensurePlayersResolvable({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: ["100", "200"],
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does nothing when given an empty list of player IDs", async () => {
    const clock = fakeClock(null);
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient();

    await ensurePlayersResolvable({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: [],
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forces a full refresh when a requested player is missing, even if the crosswalk isn't stale", async () => {
    const clock = fakeClock(new Date()); // fresh — routine refresh would normally skip
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient(["100"]); // "999" is missing

    await ensurePlayersResolvable({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: ["100", "999"],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.sleeper.app/v1/players/nfl");
    expect(prisma.upsertCalls.length).toBeGreaterThan(0);
    expect(clock.setLastRefreshedAtCalls).toHaveLength(1);
  });
});
