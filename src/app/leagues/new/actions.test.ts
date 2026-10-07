import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const createCustomLeagueMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/leagueSync/createCustomLeague", () => ({ createCustomLeague: createCustomLeagueMock }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { createCustomLeagueAction } = await import("@/app/leagues/new/actions");

const validInput = {
  name: "The Dynasty",
  teamCount: 10,
  mode: "DYNASTY" as const,
  scoringSettings: { rec: 1 },
  rosterConstruction: { QB: 1 },
};

describe("createCustomLeagueAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    createCustomLeagueMock.mockReset();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await createCustomLeagueAction(validInput);

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
    expect(createCustomLeagueMock).not.toHaveBeenCalled();
  });

  it("creates the league for the signed-in user and redirects to it", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createCustomLeagueMock.mockResolvedValue({ leagueId: "league-abc", myTeamId: "team-1" });

    await createCustomLeagueAction(validInput);

    expect(createCustomLeagueMock).toHaveBeenCalledWith(
      expect.objectContaining({ creatingUserId: "user-1", ...validInput }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/leagues/league-abc");
  });
});
