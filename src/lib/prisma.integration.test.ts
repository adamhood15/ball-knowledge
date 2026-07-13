import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Prisma schema — Phase 0 core entities", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const testUserEmail = `${testRunId}@example.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUserEmail } });
    await prisma.$disconnect();
  });

  it("persists a user, league, team, roster, and player with wired relations", async () => {
    const commissioner = await prisma.user.create({
      data: { email: testUserEmail, name: "Test Commissioner" },
    });

    const league = await prisma.league.create({
      data: {
        platform: "SLEEPER",
        name: "Test Dynasty League",
        mode: "DYNASTY",
        scoringSettings: { rec: 1 },
        rosterConstruction: { QB: 1, RB: 2, WR: 2, FLEX: 2, TE: 1, BENCH: 6 },
        createdByUserId: commissioner.id,
      },
    });

    const team = await prisma.team.create({
      data: {
        leagueId: league.id,
        ownerId: commissioner.id,
        externalTeamId: "sleeper-team-1",
      },
    });

    const roster = await prisma.roster.create({
      data: {
        teamId: team.id,
        players: [{ canonicalPlayerId: "player-1", slot: "QB" }],
      },
    });

    const player = await prisma.player.create({
      data: {
        canonicalId: `${testRunId}-player-1`,
        name: "Test Quarterback",
        position: "QB",
        nflTeam: "KC",
        byeWeek: 10,
        platformIdCrosswalk: { sleeper: "abc123" },
      },
    });

    const leagueWithTeams = await prisma.league.findUniqueOrThrow({
      where: { id: league.id },
      include: { teams: { include: { rosters: true, owner: true } } },
    });

    expect(leagueWithTeams.teams).toHaveLength(1);
    expect(leagueWithTeams.teams[0]?.owner?.email).toBe(testUserEmail);
    expect(leagueWithTeams.teams[0]?.rosters[0]?.id).toBe(roster.id);
    expect(player.position).toBe("QB");

    await prisma.roster.delete({ where: { id: roster.id } });
    await prisma.player.delete({ where: { canonicalId: player.canonicalId } });
    await prisma.team.delete({ where: { id: team.id } });
    await prisma.league.delete({ where: { id: league.id } });
  });
});
