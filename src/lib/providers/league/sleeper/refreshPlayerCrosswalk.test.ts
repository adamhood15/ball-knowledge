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

  it("excludes non-fantasy-relevant positions (offensive line, IDP, special teams) even though Sleeper reports them", async () => {
    const clock = fakeClock(null);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        "1": { player_id: "1", full_name: "Some Guard", position: "G", team: "KC" },
        "2": { player_id: "2", full_name: "Some Linebacker", position: "LB", team: "KC" },
        "3": { player_id: "3", full_name: "Some Quarterback", position: "QB", team: "KC" },
      }),
    })) as unknown as typeof fetch;
    const prisma = fakePlayerUpsertClient();

    const result = await refreshSleeperPlayerCrosswalkIfStale({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      fetchImpl,
      now: new Date(),
    });

    expect(result.playersUpserted).toBe(1);
    expect(prisma.upsertCalls).toHaveLength(1);
    expect((prisma.upsertCalls[0] as { where: { canonicalId: string } }).where.canonicalId).toBe("3");
  });

  it("captures Sleeper's real active/inactive status instead of always defaulting to active", async () => {
    const clock = fakeClock(null);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        "1": { player_id: "1", full_name: "Retired QB", position: "QB", team: null, active: false },
        "2": { player_id: "2", full_name: "Current QB", position: "QB", team: "KC", active: true },
      }),
    })) as unknown as typeof fetch;
    const prisma = fakePlayerUpsertClient();

    await refreshSleeperPlayerCrosswalkIfStale({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      fetchImpl,
      now: new Date(),
    });

    const calls = prisma.upsertCalls as { where: { canonicalId: string }; create: { active: boolean } }[];
    expect(calls.find((call) => call.where.canonicalId === "1")?.create.active).toBe(false);
    expect(calls.find((call) => call.where.canonicalId === "2")?.create.active).toBe(true);
  });

  it("sets each player's bye week from their team's 2026 schedule, and null when the team is unknown", async () => {
    const clock = fakeClock(null);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        "1": { player_id: "1", full_name: "Chiefs QB", position: "QB", team: "KC" },
        "2": { player_id: "2", full_name: "Teamless QB", position: "QB", team: null },
      }),
    })) as unknown as typeof fetch;
    const prisma = fakePlayerUpsertClient();

    await refreshSleeperPlayerCrosswalkIfStale({
      clock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      fetchImpl,
      now: new Date(),
    });

    const calls = prisma.upsertCalls as { where: { canonicalId: string }; create: { byeWeek: number | null } }[];
    expect(calls.find((call) => call.where.canonicalId === "1")?.create.byeWeek).toBe(5);
    expect(calls.find((call) => call.where.canonicalId === "2")?.create.byeWeek).toBeNull();
  });
});

describe("ensurePlayersResolvable", () => {
  it("does nothing when every requested player is already crosswalked", async () => {
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient(["100", "200"]);

    await ensurePlayersResolvable({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: ["100", "200"],
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does nothing when given an empty list of player IDs", async () => {
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient();

    await ensurePlayersResolvable({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: [],
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches and upserts only the specific players missing from the crosswalk, not the entire player list", async () => {
    const fetchImpl = fakeFetch();
    const prisma = fakePlayerUpsertClient(["100"]); // only "421" (from the fixture) is missing

    await ensurePlayersResolvable({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      canonicalPlayerIds: ["100", "421"],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.sleeper.app/v1/players/nfl");
    // The fixture has 251 fantasy-relevant players — only the one actually missing should be
    // upserted, not the whole list, or this path is exactly as slow as the routine full refresh.
    expect(prisma.upsertCalls).toHaveLength(1);
    expect((prisma.upsertCalls[0] as { where: { canonicalId: string } }).where.canonicalId).toBe("421");
  });
});
