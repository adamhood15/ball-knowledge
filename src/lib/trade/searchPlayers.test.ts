import { describe, expect, it, vi } from "vitest";
import { searchPlayers } from "@/lib/trade/searchPlayers";

function fakePlayer(overrides: Partial<{ canonicalId: string; name: string; position: string; nflTeam: string | null }>) {
  return { canonicalId: "1", name: "Player", position: "RB", nflTeam: "KC", ...overrides };
}

function fakePrisma({
  players = [],
  teams = [],
  rostersByTeamId = {},
}: {
  players?: ReturnType<typeof fakePlayer>[];
  teams?: { id: string }[];
  rostersByTeamId?: Record<string, { players: { canonicalPlayerId: string }[] } | undefined>;
}) {
  const findManyCalls: unknown[] = [];
  return {
    findManyCalls,
    player: {
      findMany: vi.fn(async (args: unknown) => {
        findManyCalls.push(args);
        return players;
      }),
    },
    team: {
      findMany: vi.fn(async () => teams),
    },
    roster: {
      findFirst: vi.fn(async ({ where }: { where: { teamId: string } }) => rostersByTeamId[where.teamId] ?? null),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("searchPlayers", () => {
  it("returns nothing for a query under 2 characters, to avoid a table-wide scan", async () => {
    const prisma = fakePrisma({ players: [fakePlayer({})] });

    const results = await searchPlayers({ prisma, query: "j" });

    expect(results).toEqual([]);
    expect(prisma.player.findMany).not.toHaveBeenCalled();
  });

  it("searches all players by name, case-insensitively, when no league is given", async () => {
    const prisma = fakePrisma({
      players: [fakePlayer({ canonicalId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" })],
    });

    const results = await searchPlayers({ prisma, query: "chase" });

    expect(results).toEqual([{ canonicalPlayerId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" }]);
    const call = prisma.findManyCalls[0] as { where: { name: { contains: string; mode: string } } };
    expect(call.where.name).toEqual({ contains: "chase", mode: "insensitive" });
    expect(call.where).not.toHaveProperty("canonicalId");
  });

  it("scopes results to only players rostered somewhere in the given league", async () => {
    const prisma = fakePrisma({
      players: [fakePlayer({ canonicalId: "100" })],
      teams: [{ id: "team-1" }, { id: "team-2" }],
      rostersByTeamId: {
        "team-1": { players: [{ canonicalPlayerId: "100" }] },
        "team-2": { players: [{ canonicalPlayerId: "200" }] },
      },
    });

    await searchPlayers({ prisma, query: "chase", leagueId: "league-1" });

    const call = prisma.findManyCalls[0] as { where: { canonicalId: { in: string[] } } };
    expect(new Set(call.where.canonicalId.in)).toEqual(new Set(["100", "200"]));
  });

  it("returns nothing without querying players when the league has no rostered players at all", async () => {
    const prisma = fakePrisma({ players: [fakePlayer({})], teams: [] });

    const results = await searchPlayers({ prisma, query: "chase", leagueId: "league-1" });

    expect(results).toEqual([]);
    expect(prisma.player.findMany).not.toHaveBeenCalled();
  });

  it("passes the limit through to the query", async () => {
    const prisma = fakePrisma({ players: [] });

    await searchPlayers({ prisma, query: "chase", limit: 3 });

    const call = prisma.findManyCalls[0] as { take: number };
    expect(call.take).toBe(3);
  });

  it("restricts results to fantasy-relevant positions and active players", async () => {
    const prisma = fakePrisma({ players: [] });

    await searchPlayers({ prisma, query: "chase" });

    const call = prisma.findManyCalls[0] as { where: { position: { in: string[] }; active: boolean } };
    expect(call.where.position).toEqual({ in: ["QB", "RB", "WR", "TE", "K", "DEF"] });
    expect(call.where.active).toBe(true);
  });
});
