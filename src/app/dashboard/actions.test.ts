import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const syncSleeperLeagueMock = vi.hoisted(() => vi.fn());
const refreshCrosswalkMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
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
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { syncSleeperLeagueAction } = await import("@/app/dashboard/actions");

function formDataWith(sleeperLeagueId: string | null) {
  const formData = new FormData();
  if (sleeperLeagueId !== null) formData.set("sleeperLeagueId", sleeperLeagueId);
  return formData;
}

describe("syncSleeperLeagueAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    syncSleeperLeagueMock.mockReset();
    refreshCrosswalkMock.mockReset().mockResolvedValue({ refreshed: false, playersUpserted: 0 });
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await syncSleeperLeagueAction({ error: null }, formDataWith("123"));

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
    expect(syncSleeperLeagueMock).not.toHaveBeenCalled();
  });

  it("returns an error when the league ID is blank", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await syncSleeperLeagueAction({ error: null }, formDataWith("   "));

    expect(result.error).toMatch(/league id/i);
    expect(syncSleeperLeagueMock).not.toHaveBeenCalled();
  });

  it("syncs the league and redirects to the league detail page on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    syncSleeperLeagueMock.mockResolvedValue({ leagueId: "league-abc" });

    await syncSleeperLeagueAction({ error: null }, formDataWith("1347028745252257792"));

    expect(syncSleeperLeagueMock).toHaveBeenCalledWith(
      expect.objectContaining({ externalLeagueId: "1347028745252257792", syncingUserId: "user-1" }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/leagues/league-abc");
  });

  it("returns a friendly error and does not redirect when the sync fails", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    syncSleeperLeagueMock.mockRejectedValue(new Error("Sleeper API request failed"));

    const result = await syncSleeperLeagueAction({ error: null }, formDataWith("bad-id"));

    expect(result.error).toMatch(/couldn't sync/i);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
