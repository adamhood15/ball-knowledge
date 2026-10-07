import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const afterMock = vi.hoisted(() => vi.fn());
const syncSleeperLeagueMock = vi.hoisted(() => vi.fn());
const refreshCrosswalkMock = vi.hoisted(() => vi.fn());
const resolveSleeperUsernameMock = vi.hoisted(() => vi.fn());
const getCurrentNflSeasonMock = vi.hoisted(() => vi.fn());
const getSleeperUserLeaguesMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/leagueSync/syncSleeperLeague", () => ({ syncSleeperLeague: syncSleeperLeagueMock }));
vi.mock("@/lib/providers/league/sleeper/refreshPlayerCrosswalk", () => ({
  refreshSleeperPlayerCrosswalkIfStale: refreshCrosswalkMock,
}));
vi.mock("@/lib/providers/league/sleeper/playerCrosswalkClock", () => ({
  createUpstashPlayerCrosswalkClock: vi.fn(() => ({})),
}));
vi.mock("@/lib/providers/league/sleeper/SleeperProvider", () => ({
  SleeperProvider: vi.fn(),
}));
vi.mock("@/lib/providers/league/sleeper/sleeperUserLookup", () => ({
  resolveSleeperUsername: resolveSleeperUsernameMock,
  getCurrentNflSeason: getCurrentNflSeasonMock,
  getSleeperUserLeagues: getSleeperUserLeaguesMock,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { lookupSleeperLeaguesAction, syncSelectedSleeperLeaguesAction } = await import("@/app/dashboard/actions");

function formDataWith(username: string | null) {
  const formData = new FormData();
  if (username !== null) formData.set("username", username);
  return formData;
}

describe("lookupSleeperLeaguesAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    resolveSleeperUsernameMock.mockReset();
    getCurrentNflSeasonMock.mockReset();
    getSleeperUserLeaguesMock.mockReset();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await lookupSleeperLeaguesAction({ error: null, result: null }, formDataWith("mahomes15"));

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
    expect(resolveSleeperUsernameMock).not.toHaveBeenCalled();
  });

  it("returns an error when the username is blank", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await lookupSleeperLeaguesAction({ error: null, result: null }, formDataWith("   "));

    expect(result.error).toMatch(/username/i);
    expect(resolveSleeperUsernameMock).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the username isn't found", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveSleeperUsernameMock.mockResolvedValue(null);

    const result = await lookupSleeperLeaguesAction({ error: null, result: null }, formDataWith("nobody-real"));

    expect(result.error).toMatch(/couldn't find/i);
    expect(result.result).toBeNull();
  });

  it("returns the resolved user's leagues for the current season on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveSleeperUsernameMock.mockResolvedValue({ externalUserId: "12345", displayName: "Mahomes15" });
    getCurrentNflSeasonMock.mockResolvedValue("2026");
    getSleeperUserLeaguesMock.mockResolvedValue([{ externalLeagueId: "111", name: "League A" }]);

    const result = await lookupSleeperLeaguesAction({ error: null, result: null }, formDataWith("mahomes15"));

    expect(getSleeperUserLeaguesMock).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "12345", season: "2026" }),
    );
    expect(result).toEqual({
      error: null,
      result: {
        sleeperUserId: "12345",
        sleeperUsername: "Mahomes15",
        leagues: [{ externalLeagueId: "111", name: "League A" }],
      },
    });
  });

  it("returns a friendly error when the Sleeper API call fails", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveSleeperUsernameMock.mockRejectedValue(new Error("network error"));

    const result = await lookupSleeperLeaguesAction({ error: null, result: null }, formDataWith("mahomes15"));

    expect(result.error).toMatch(/couldn't look up/i);
  });
});

describe("syncSelectedSleeperLeaguesAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    afterMock.mockReset();
    syncSleeperLeagueMock.mockReset();
    refreshCrosswalkMock.mockReset().mockResolvedValue({ refreshed: false, playersUpserted: 0 });
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await syncSelectedSleeperLeaguesAction("12345", ["111"]);

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
    expect(syncSleeperLeagueMock).not.toHaveBeenCalled();
  });

  it("syncs every selected league, auto-claiming the team owned by the resolved sleeper user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    syncSleeperLeagueMock.mockResolvedValue({ leagueId: "league-abc" });

    await syncSelectedSleeperLeaguesAction("12345", ["111", "222"]);

    expect(syncSleeperLeagueMock).toHaveBeenCalledTimes(2);
    expect(syncSleeperLeagueMock).toHaveBeenCalledWith(
      expect.objectContaining({ externalLeagueId: "111", syncingUserId: "user-1", autoClaimExternalUserId: "12345" }),
    );
    expect(syncSleeperLeagueMock).toHaveBeenCalledWith(
      expect.objectContaining({ externalLeagueId: "222", syncingUserId: "user-1", autoClaimExternalUserId: "12345" }),
    );
  });

  it("defers the player crosswalk refresh via after(), once, and redirects to the dashboard", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    syncSleeperLeagueMock.mockResolvedValue({ leagueId: "league-abc" });

    await syncSelectedSleeperLeaguesAction("12345", ["111", "222"]);

    expect(afterMock).toHaveBeenCalledTimes(1);
    await afterMock.mock.calls[0]![0]();
    expect(refreshCrosswalkMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  // Regression test: a league sync must never look broken because of this background job.
  // The crosswalk refresh (e.g. its Upstash Redis staleness check) can fail independently of
  // the sync it rides along with — that must log, not reject, since after() runs post-response
  // and an unhandled rejection here says nothing useful about whether the sync itself worked.
  it("logs and swallows a background crosswalk refresh failure instead of letting it reject", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    syncSleeperLeagueMock.mockResolvedValue({ leagueId: "league-abc" });
    refreshCrosswalkMock.mockReset().mockRejectedValue(new Error("getaddrinfo ENOTFOUND clean-skunk-40809.upstash.io"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await syncSelectedSleeperLeaguesAction("12345", ["111"]);

    await expect(afterMock.mock.calls[0]![0]()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("player crosswalk refresh"),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
