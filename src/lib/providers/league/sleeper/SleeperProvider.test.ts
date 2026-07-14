import { describe, expect, it, vi } from "vitest";
import leagueFixture from "./__fixtures__/league.json";
import rostersFixture from "./__fixtures__/rosters.json";
import usersFixture from "./__fixtures__/users.json";
import { SleeperProvider } from "@/lib/providers/league/sleeper/SleeperProvider";

function fakeFetch(responsesByUrlSuffix: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const matchingSuffix = Object.keys(responsesByUrlSuffix).find((suffix) => url.endsWith(suffix));
    if (!matchingSuffix) {
      throw new Error(`No fixture registered for fetched URL: ${url}`);
    }
    return {
      ok: true,
      status: 200,
      json: async () => responsesByUrlSuffix[matchingSuffix],
    } as Response;
  });
}

describe("SleeperProvider", () => {
  const leagueId = leagueFixture.league_id;

  it("getLeagueInfo returns league name, season, roster slots, and scoring settings", async () => {
    const fetchImpl = fakeFetch({ [`/league/${leagueId}`]: leagueFixture });
    const provider = new SleeperProvider(fetchImpl);

    const info = await provider.getLeagueInfo(leagueId);

    expect(info.externalLeagueId).toBe(leagueId);
    expect(info.name).toBe(leagueFixture.name);
    expect(info.season).toBe(leagueFixture.season);
    expect(info.rosterPositionSlots).toEqual(leagueFixture.roster_positions);
    expect(info.scoringSettings.rec).toBe(0.5);
  });

  it("getRosters assigns each starter its specific roster slot, in the league's slot order, with bench players trailing and null-slotted", async () => {
    const fetchImpl = fakeFetch({ [`/league/${leagueId}/rosters`]: rostersFixture });
    const provider = new SleeperProvider(fetchImpl);

    const rosters = await provider.getRosters(leagueId, leagueFixture.roster_positions);

    expect(rosters).toHaveLength(rostersFixture.length);
    const firstRoster = rosters[0]!;
    const firstFixtureRoster = rostersFixture[0]!;
    expect(firstRoster.externalTeamId).toBe(String(firstFixtureRoster.roster_id));
    expect(firstRoster.ownerExternalUserId).toBe(firstFixtureRoster.owner_id);
    expect(firstRoster.players).toHaveLength(firstFixtureRoster.players.length);

    const startingSlotLabels = leagueFixture.roster_positions.filter((slot) => slot !== "BN");
    const expectedSlotByPlayerId = new Map<string, string>();
    firstFixtureRoster.starters.forEach((playerId, index) => {
      if (playerId !== "0") expectedSlotByPlayerId.set(playerId, startingSlotLabels[index]!);
    });

    for (const player of firstRoster.players) {
      expect(player.rosterSlot).toBe(expectedSlotByPlayerId.get(player.canonicalPlayerId) ?? null);
    }

    const starterCanonicalIdsInOrder = firstRoster.players
      .filter((player) => player.rosterSlot !== null)
      .map((player) => player.canonicalPlayerId);
    expect(starterCanonicalIdsInOrder).toEqual([...expectedSlotByPlayerId.keys()]);
  });

  it("getScoringSettings returns the league's raw stat category point values", async () => {
    const fetchImpl = fakeFetch({ [`/league/${leagueId}`]: leagueFixture });
    const provider = new SleeperProvider(fetchImpl);

    const scoringSettings = await provider.getScoringSettings(leagueId);

    expect(scoringSettings).toEqual(leagueFixture.scoring_settings);
  });

  it("getLeagueMembers returns display name, team name, and avatar URL per user", async () => {
    const fetchImpl = fakeFetch({ [`/league/${leagueId}/users`]: usersFixture });
    const provider = new SleeperProvider(fetchImpl);

    const members = await provider.getLeagueMembers(leagueId);

    expect(members).toHaveLength(usersFixture.length);
    const memberWithTeamName = usersFixture.find((user) => user.metadata?.team_name);
    const found = members.find((member) => member.externalUserId === memberWithTeamName!.user_id);
    expect(found?.teamName).toBe(memberWithTeamName!.metadata.team_name);
    expect(found?.avatarUrl).toBe(`https://sleepercdn.com/avatars/${memberWithTeamName!.avatar}`);
  });

  it("throws a descriptive error when Sleeper responds with a non-OK status", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }) as Response);
    const provider = new SleeperProvider(fetchImpl);

    await expect(provider.getLeagueInfo("nonexistent")).rejects.toThrow(/Sleeper API request failed/);
  });
});
