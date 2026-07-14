import { afterAll, beforeAll, describe, expect, it } from "vitest";
import leagueFixture from "@/lib/providers/league/sleeper/__fixtures__/league.json";
import rostersFixture from "@/lib/providers/league/sleeper/__fixtures__/rosters.json";
import usersFixture from "@/lib/providers/league/sleeper/__fixtures__/users.json";
import { SleeperProvider } from "@/lib/providers/league/sleeper/SleeperProvider";
import { syncSleeperLeague } from "@/lib/leagueSync/syncSleeperLeague";
import { prisma } from "@/lib/prisma";

function fixtureBackedSleeperProvider() {
  const responsesByUrlSuffix: Record<string, unknown> = {
    [`/league/${leagueFixture.league_id}/rosters`]: rostersFixture,
    [`/league/${leagueFixture.league_id}/users`]: usersFixture,
    [`/league/${leagueFixture.league_id}`]: leagueFixture,
  };
  const fetchImpl = (async (url: string) => {
    const matchingSuffix = Object.keys(responsesByUrlSuffix).find((suffix) => url.endsWith(suffix));
    if (!matchingSuffix) throw new Error(`No fixture registered for: ${url}`);
    return { ok: true, status: 200, json: async () => responsesByUrlSuffix[matchingSuffix] } as Response;
  }) as unknown as typeof fetch;

  return new SleeperProvider(fetchImpl);
}

describe("syncSleeperLeague (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerUserId: string;
  let otherUserId: string;
  let syncedLeagueId: string;

  beforeAll(async () => {
    // Defends against a stale row left behind by a prior interrupted run — this fixture's
    // externalLeagueId is a real league ID, so a leaked row here would silently break the
    // "commissioner is preserved" assertions below by attaching to someone else's league.
    await prisma.league.deleteMany({
      where: { platform: "SLEEPER", externalLeagueId: leagueFixture.league_id },
    });
  });

  afterAll(async () => {
    if (syncedLeagueId) await prisma.league.delete({ where: { id: syncedLeagueId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("creates the league, teams, and an initial roster snapshot for each team", async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerUserId = commissioner.id;

    const result = await syncSleeperLeague({
      leagueProvider: fixtureBackedSleeperProvider(),
      prisma,
      externalLeagueId: leagueFixture.league_id,
      syncingUserId: commissionerUserId,
    });
    syncedLeagueId = result.leagueId;

    const league = await prisma.league.findUniqueOrThrow({
      where: { id: result.leagueId },
      include: { teams: { include: { rosters: true } } },
    });

    expect(league.platform).toBe("SLEEPER");
    expect(league.name).toBe(leagueFixture.name);
    expect(league.createdByUserId).toBe(commissionerUserId);
    expect(league.scoringSettings).toEqual(leagueFixture.scoring_settings);
    expect(league.rosterConstruction).toEqual({
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 2,
      K: 1,
      DEF: 1,
      BENCH: 10,
    });
    expect(league.teams).toHaveLength(rostersFixture.length);

    const firstTeam = league.teams.find((team) => team.externalTeamId === String(rostersFixture[0]!.roster_id))!;
    expect(firstTeam.rosters).toHaveLength(1);
    const storedPlayers = firstTeam.rosters[0]!.players as { canonicalPlayerId: string; rosterSlot: string | null }[];
    expect(storedPlayers).toHaveLength(rostersFixture[0]!.players.length);
    const firstStarterId = rostersFixture[0]!.starters.find((id) => id !== "0")!;
    const firstStarter = storedPlayers.find((p) => p.canonicalPlayerId === firstStarterId)!;
    expect(firstStarter.rosterSlot).toBe(leagueFixture.roster_positions[0]);
    const benchPlayer = storedPlayers.find((p) => p.rosterSlot === null);
    expect(benchPlayer).toBeDefined();
  });

  it("re-syncing updates league settings and appends a new roster snapshot, without changing the commissioner", async () => {
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;

    const result = await syncSleeperLeague({
      leagueProvider: fixtureBackedSleeperProvider(),
      prisma,
      externalLeagueId: leagueFixture.league_id,
      syncingUserId: otherUserId,
    });

    expect(result.leagueId).toBe(syncedLeagueId);

    const league = await prisma.league.findUniqueOrThrow({
      where: { id: result.leagueId },
      include: { teams: { include: { rosters: true } } },
    });

    expect(league.createdByUserId).toBe(commissionerUserId);
    expect(league.teams).toHaveLength(rostersFixture.length);
    const firstTeam = league.teams.find((team) => team.externalTeamId === String(rostersFixture[0]!.roster_id))!;
    expect(firstTeam.rosters).toHaveLength(2);
  });
});
