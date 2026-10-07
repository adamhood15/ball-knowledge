import { afterAll, describe, expect, it } from "vitest";
import { createCustomLeague } from "@/lib/leagueSync/createCustomLeague";
import { prisma } from "@/lib/prisma";

describe("createCustomLeague (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}@example.com`;
  const createdLeagueIds: string[] = [];
  let commissionerId: string;

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: { in: createdLeagueIds } } });
    await prisma.user.deleteMany({ where: { email: commissionerEmail } });
    await prisma.$disconnect();
  });

  it("persists a MANUAL league, the requested number of teams, and claims one team for the creator", async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;

    const result = await createCustomLeague({
      prisma,
      creatingUserId: commissionerId,
      name: "Test Custom League",
      mode: "DYNASTY",
      teamCount: 4,
      scoringSettings: { rec: 1 },
      rosterConstruction: { QB: 1, BENCH: 5 },
    });
    createdLeagueIds.push(result.leagueId);

    const league = await prisma.league.findUniqueOrThrow({ where: { id: result.leagueId } });
    expect(league.platform).toBe("MANUAL");
    expect(league.externalLeagueId).toBeNull();
    expect(league.mode).toBe("DYNASTY");
    expect(league.scoringSettings).toEqual({ rec: 1 });
    expect(league.rosterConstruction).toEqual({ QB: 1, BENCH: 5 });
    expect(league.createdByUserId).toBe(commissionerId);

    const teams = await prisma.team.findMany({ where: { leagueId: result.leagueId }, orderBy: { externalTeamId: "asc" } });
    expect(teams).toHaveLength(4);

    const myTeam = teams.find((team) => team.id === result.myTeamId);
    expect(myTeam?.ownerId).toBe(commissionerId);

    const otherTeams = teams.filter((team) => team.id !== result.myTeamId);
    expect(otherTeams).toHaveLength(3);
    for (const team of otherTeams) {
      expect(team.ownerId).toBeNull();
    }
  });

  it("gives the creator's team a real name and the rest clearly-labeled placeholder names", async () => {
    const result = await createCustomLeague({
      prisma,
      creatingUserId: commissionerId,
      name: "Named Teams Test League",
      mode: "REDRAFT",
      teamCount: 2,
      scoringSettings: { rec: 0.5 },
      rosterConstruction: { QB: 1 },
      myTeamName: "Dynasty Warriors",
    });
    createdLeagueIds.push(result.leagueId);

    const myTeam = await prisma.team.findUniqueOrThrow({ where: { id: result.myTeamId } });
    expect(myTeam.platformTeamName).toBe("Dynasty Warriors");

    const otherTeam = await prisma.team.findFirstOrThrow({
      where: { leagueId: result.leagueId, id: { not: result.myTeamId } },
    });
    expect(otherTeam.platformTeamName).toBe("Team 2");
  });

  it("persists the creator's roster when players are provided, and leaves other teams rosterless", async () => {
    const result = await createCustomLeague({
      prisma,
      creatingUserId: commissionerId,
      name: "Own Roster Test League",
      mode: "REDRAFT",
      teamCount: 2,
      scoringSettings: { rec: 1 },
      rosterConstruction: { QB: 1, BENCH: 1 },
      myTeamRoster: [
        { canonicalPlayerId: "player-qb-1", rosterSlot: "QB" },
        { canonicalPlayerId: "player-bench-1", rosterSlot: null },
      ],
    });
    createdLeagueIds.push(result.leagueId);

    const myRoster = await prisma.roster.findFirst({ where: { teamId: result.myTeamId } });
    expect(myRoster?.players).toEqual([
      { canonicalPlayerId: "player-qb-1", rosterSlot: "QB" },
      { canonicalPlayerId: "player-bench-1", rosterSlot: null },
    ]);

    const otherTeam = await prisma.team.findFirstOrThrow({
      where: { leagueId: result.leagueId, id: { not: result.myTeamId } },
    });
    const otherRoster = await prisma.roster.findFirst({ where: { teamId: otherTeam.id } });
    expect(otherRoster).toBeNull();
  });

  it("does not create a roster row at all when no players are provided", async () => {
    const result = await createCustomLeague({
      prisma,
      creatingUserId: commissionerId,
      name: "No Roster Test League",
      mode: "REDRAFT",
      teamCount: 1,
      scoringSettings: { rec: 1 },
      rosterConstruction: { QB: 1 },
    });
    createdLeagueIds.push(result.leagueId);

    const myRoster = await prisma.roster.findFirst({ where: { teamId: result.myTeamId } });
    expect(myRoster).toBeNull();
  });
});
