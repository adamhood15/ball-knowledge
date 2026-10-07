import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getTeamRosterView } from "@/lib/leagueSync/getTeamRosterView";
import { prisma } from "@/lib/prisma";

describe("getTeamRosterView (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}@example.com`;
  let leagueId: string;
  let teamId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    const league = await prisma.league.create({
      data: {
        platform: "SLEEPER",
        externalLeagueId: `roster-view-test-${testRunId}`,
        name: "Roster View Test League",
        createdByUserId: commissioner.id,
      },
    });
    leagueId = league.id;
    const team = await prisma.team.create({
      data: {
        leagueId,
        externalTeamId: "1",
        platformTeamName: "Alice's Aces",
        platformAvatarUrl: "https://sleepercdn.com/avatars/abc",
      },
    });
    teamId = team.id;
    await prisma.player.create({
      data: { canonicalId: `${testRunId}-p1`, name: "Known Player", normalizedName: "known player", position: "RB" },
    });
    await prisma.roster.create({
      data: {
        teamId,
        players: [
          { canonicalPlayerId: `${testRunId}-p1`, rosterSlot: "RB" },
          { canonicalPlayerId: `${testRunId}-p2`, rosterSlot: null },
        ],
      },
    });
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.player.deleteMany({ where: { canonicalId: { in: [`${testRunId}-p1`, `${testRunId}-p2`] } } });
    await prisma.user.deleteMany({ where: { email: commissionerEmail } });
    await prisma.$disconnect();
  });

  it("returns null when the team doesn't exist", async () => {
    const view = await getTeamRosterView({ prisma, teamId: "nonexistent", fetchImpl: vi.fn() });

    expect(view).toBeNull();
  });

  it("returns the team's display info and resolved roster, forcing a crosswalk refresh for missing players", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        [`${testRunId}-p2`]: { player_id: `${testRunId}-p2`, full_name: "Fetched Player", position: "WR", team: "KC" },
      }),
    })) as unknown as typeof fetch;

    const view = await getTeamRosterView({ prisma, teamId, fetchImpl });

    expect(view).not.toBeNull();
    expect(view!.teamName).toBe("Alice's Aces");
    expect(view!.avatarUrl).toBe("https://sleepercdn.com/avatars/abc");
    expect(view!.players).toEqual([
      { canonicalPlayerId: `${testRunId}-p1`, name: "Known Player", position: "RB", nflTeam: null, byeWeek: null, projectedValue: null, rosterSlot: "RB" },
      { canonicalPlayerId: `${testRunId}-p2`, name: "Fetched Player", position: "WR", nflTeam: "KC", byeWeek: 5, projectedValue: null, rosterSlot: null },
    ]);
    expect(fetchImpl).toHaveBeenCalled();
  });
});
