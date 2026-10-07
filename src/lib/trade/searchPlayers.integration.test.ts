import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchPlayers } from "@/lib/trade/searchPlayers";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";
import { prisma } from "@/lib/prisma";

describe("searchPlayers (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const chaseId = `${testRunId}-chase`;
  const higginsId = `${testRunId}-higgins`;
  const mahomesId = `${testRunId}-mahomes`;
  let leagueId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.player.createMany({
      data: [
        {
          canonicalId: chaseId,
          name: `Ja'Marr Chase ${testRunId}`,
          normalizedName: normalizePlayerName(`Ja'Marr Chase ${testRunId}`),
          position: "WR",
          nflTeam: "CIN",
        },
        {
          canonicalId: higginsId,
          name: `Tee Higgins ${testRunId}`,
          normalizedName: normalizePlayerName(`Tee Higgins ${testRunId}`),
          position: "WR",
          nflTeam: "CIN",
        },
        {
          canonicalId: mahomesId,
          name: `Patrick Mahomes ${testRunId}`,
          normalizedName: normalizePlayerName(`Patrick Mahomes ${testRunId}`),
          position: "QB",
          nflTeam: "KC",
        },
      ],
    });

    const user = await prisma.user.create({ data: { email: `${testRunId}@example.com` } });
    userId = user.id;
    const league = await prisma.league.create({
      data: { platform: "MANUAL", name: "Search Test League", createdByUserId: userId },
    });
    leagueId = league.id;
    const team = await prisma.team.create({ data: { leagueId, externalTeamId: "1" } });
    await prisma.roster.create({
      data: { teamId: team.id, players: [{ canonicalPlayerId: chaseId, rosterSlot: "WR" }] },
    });
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.player.deleteMany({ where: { canonicalId: { in: [chaseId, higginsId, mahomesId] } } });
    await prisma.$disconnect();
  });

  it("finds a player by a partial name, case-insensitively, against real shared crosswalk data", async () => {
    // Search on the (unique, collision-proof) testRunId suffix in an different case than stored,
    // rather than "chase" — real synced NFL players legitimately named Chase would otherwise
    // outrank our fixture player alphabetically and push it past the result limit.
    const results = await searchPlayers({ prisma, query: testRunId.toUpperCase() });

    expect(results.some((p) => p.canonicalPlayerId === chaseId)).toBe(true);
  });

  it("scopes to only the league's rostered player, excluding a same-name-prefix player not on any roster in it", async () => {
    const results = await searchPlayers({ prisma, query: testRunId, leagueId });

    const foundIds = results.map((p) => p.canonicalPlayerId);
    expect(foundIds).toContain(chaseId);
    expect(foundIds).not.toContain(higginsId);
    expect(foundIds).not.toContain(mahomesId);
  });
});
