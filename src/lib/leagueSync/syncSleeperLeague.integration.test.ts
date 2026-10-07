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
  const claimingUserEmail = `${testRunId}-claiming@example.com`;
  let commissionerUserId: string;
  let otherUserId: string;
  let syncedLeagueId: string;

  beforeAll(async () => {
    // Defends against a stale row left behind by a prior interrupted run. The fixture's
    // externalLeagueId must stay a synthetic value that can never match a real Sleeper league —
    // it previously reused a real recorded league's ID, and this same deleteMany silently
    // deleted that real league (and this test's own afterAll then deleted whatever ended up at
    // that row) every time the suite ran, against the shared dev database.
    await prisma.league.deleteMany({
      where: { platform: "SLEEPER", externalLeagueId: leagueFixture.league_id },
    });
  });

  afterAll(async () => {
    // League delete cascades to its Teams first, so a Team.ownerId FK to a user created in
    // one of these tests never blocks that user's own deletion below.
    if (syncedLeagueId) await prisma.league.delete({ where: { id: syncedLeagueId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail, claimingUserEmail] } } });
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
    // Fixture is a real recorded dynasty league response (settings.type === 2).
    expect(league.mode).toBe("DYNASTY");
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
    const firstFixtureRoster = rostersFixture[0]!;
    const firstFixtureOwner = usersFixture.find((user) => user.user_id === firstFixtureRoster.owner_id);
    expect(firstTeam.platformAvatarUrl).toBe(`https://sleepercdn.com/avatars/${firstFixtureOwner!.avatar}`);
    expect(firstTeam.rosters).toHaveLength(1);
    const storedPlayers = firstTeam.rosters[0]!.players as { canonicalPlayerId: string; rosterSlot: string | null }[];
    expect(storedPlayers).toHaveLength(rostersFixture[0]!.players.length);
    const firstStarterId = rostersFixture[0]!.starters.find((id) => id !== "0")!;
    const firstStarter = storedPlayers.find((p) => p.canonicalPlayerId === firstStarterId)!;
    expect(firstStarter.rosterSlot).toBe(leagueFixture.roster_positions[0]);
    const benchPlayer = storedPlayers.find((p) => p.rosterSlot === null);
    expect(benchPlayer).toBeDefined();

    expect(firstTeam.wins).toBe(firstFixtureRoster.settings.wins);
    expect(firstTeam.losses).toBe(firstFixtureRoster.settings.losses);
    expect(firstTeam.ties).toBe(firstFixtureRoster.settings.ties);
    expect(firstTeam.pointsFor).toBe(firstFixtureRoster.settings.fpts);
    expect(firstTeam.pointsAgainst).toBe(0);
    expect(firstTeam.waiverPosition).toBe(firstFixtureRoster.settings.waiver_position);
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

  it("auto-claims the team owned by the given Sleeper external user id, leaving every other team unowned", async () => {
    const claimingUser = await prisma.user.create({ data: { email: claimingUserEmail } });

    const result = await syncSleeperLeague({
      leagueProvider: fixtureBackedSleeperProvider(),
      prisma,
      externalLeagueId: leagueFixture.league_id,
      syncingUserId: claimingUser.id,
      autoClaimExternalUserId: rostersFixture[0]!.owner_id,
    });

    const teams = await prisma.team.findMany({ where: { leagueId: result.leagueId } });
    const claimedTeam = teams.find((team) => team.externalTeamId === String(rostersFixture[0]!.roster_id))!;
    expect(claimedTeam.ownerId).toBe(claimingUser.id);

    const otherTeams = teams.filter((team) => team.id !== claimedTeam.id);
    for (const team of otherTeams) {
      expect(team.ownerId).toBeNull();
    }
  });
});
