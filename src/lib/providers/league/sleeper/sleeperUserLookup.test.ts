import { describe, expect, it, vi } from "vitest";
import {
  getCurrentNflSeason,
  getCurrentNflWeek,
  getSleeperUserLeagues,
  resolveSleeperUsername,
} from "@/lib/providers/league/sleeper/sleeperUserLookup";

function fakeFetch(responsesByUrlSuffix: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const matchingSuffix = Object.keys(responsesByUrlSuffix).find((suffix) => url.endsWith(suffix));
    if (!matchingSuffix) throw new Error(`No fixture registered for fetched URL: ${url}`);
    return { ok: true, status: 200, json: async () => responsesByUrlSuffix[matchingSuffix] } as Response;
  });
}

describe("resolveSleeperUsername", () => {
  it("returns the external user id and display name for a real username", async () => {
    const fetchImpl = fakeFetch({
      "/user/mahomes15": { user_id: "12345", display_name: "Mahomes15", username: "mahomes15" },
    });

    const result = await resolveSleeperUsername({ username: "mahomes15", fetchImpl });

    expect(result).toEqual({ externalUserId: "12345", displayName: "Mahomes15" });
  });

  // Sleeper's API returns HTTP 200 with a JSON body of `null` for a username that doesn't
  // exist, rather than a 404 — this must be treated as "not found," not an error or a crash.
  it("returns null when Sleeper responds with a null body for an unknown username", async () => {
    const fetchImpl = fakeFetch({ "/user/nobody-real": null });

    const result = await resolveSleeperUsername({ username: "nobody-real", fetchImpl });

    expect(result).toBeNull();
  });
});

describe("getCurrentNflSeason", () => {
  it("returns Sleeper's reported current league season", async () => {
    const fetchImpl = fakeFetch({ "/state/nfl": { league_season: "2026" } });

    const season = await getCurrentNflSeason({ fetchImpl });

    expect(season).toBe("2026");
  });
});

describe("getCurrentNflWeek", () => {
  it("returns Sleeper's reported current week", async () => {
    const fetchImpl = fakeFetch({ "/state/nfl": { week: 6 } });

    const week = await getCurrentNflWeek({ fetchImpl });

    expect(week).toBe(6);
  });

  it("returns 0 during the off-season, when Sleeper itself reports week 0", async () => {
    const fetchImpl = fakeFetch({ "/state/nfl": { week: 0 } });

    const week = await getCurrentNflWeek({ fetchImpl });

    expect(week).toBe(0);
  });
});

describe("getSleeperUserLeagues", () => {
  it("returns each current-season league's external id and name", async () => {
    const fetchImpl = fakeFetch({
      "/user/12345/leagues/nfl/2026": [
        { league_id: "111", name: "League A", previous_league_id: null },
        { league_id: "222", name: "League B", previous_league_id: null },
      ],
      "/user/12345/leagues/nfl/2025": [],
    });

    const leagues = await getSleeperUserLeagues({ externalUserId: "12345", season: "2026", fetchImpl });

    expect(leagues).toEqual([
      { externalLeagueId: "111", name: "League A" },
      { externalLeagueId: "222", name: "League B" },
    ]);
  });

  it("returns an empty list when the user has no leagues in the current or previous season", async () => {
    const fetchImpl = fakeFetch({
      "/user/12345/leagues/nfl/2026": [],
      "/user/12345/leagues/nfl/2025": [],
    });

    const leagues = await getSleeperUserLeagues({ externalUserId: "12345", season: "2026", fetchImpl });

    expect(leagues).toEqual([]);
  });

  // A dynasty/keeper league that hasn't rolled over to this season yet only shows up under last
  // season's id — a league that HAS rolled over shows up twice (its old, now-superseded id under
  // last season, and its new id under this season), and only the new one should be returned.
  it("includes a previous-season league that hasn't rolled over yet, alongside current-season leagues", async () => {
    const fetchImpl = fakeFetch({
      "/user/12345/leagues/nfl/2026": [
        { league_id: "new-id", name: "Rolled Over League", previous_league_id: "old-id" },
      ],
      "/user/12345/leagues/nfl/2025": [
        { league_id: "old-id", name: "Rolled Over League", previous_league_id: null },
        { league_id: "not-rolled-over-id", name: "Not Rolled Over Yet", previous_league_id: null },
      ],
    });

    const leagues = await getSleeperUserLeagues({ externalUserId: "12345", season: "2026", fetchImpl });

    expect(leagues).toEqual([
      { externalLeagueId: "new-id", name: "Rolled Over League" },
      { externalLeagueId: "not-rolled-over-id", name: "Not Rolled Over Yet" },
    ]);
  });
});
