import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateCustomLeagueWizard } from "@/components/leagues/CreateCustomLeagueWizard";

vi.mock("@/components/trade/PlayerSearchInput", () => ({
  PlayerSearchInput: ({ onSelectPlayer, placeholder }: { onSelectPlayer: (p: unknown) => void; placeholder?: string }) => (
    <button
      type="button"
      onClick={() =>
        onSelectPlayer({ canonicalPlayerId: placeholder, name: `Player for ${placeholder}`, position: "RB", nflTeam: "SF" })
      }
    >
      mock-search-select
    </button>
  ),
}));

describe("CreateCustomLeagueWizard", () => {
  it("starts on the league details step", () => {
    render(<CreateCustomLeagueWizard createCustomLeagueAction={vi.fn()} />);

    expect(screen.getByLabelText(/league name/i)).toBeInTheDocument();
  });

  it("advances details -> settings -> roster construction, then calls the action with the combined result", async () => {
    const createCustomLeagueActionMock = vi.fn().mockResolvedValue({ leagueId: "league-1" });
    const user = userEvent.setup();
    render(<CreateCustomLeagueWizard createCustomLeagueAction={createCustomLeagueActionMock} />);

    await user.type(screen.getByLabelText(/league name/i), "The Dynasty");
    await user.selectOptions(screen.getByLabelText(/number of teams/i), "10");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByRole("button", { name: "Redraft" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dynasty" }));
    await user.click(screen.getByRole("button", { name: "Superflex" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(rows.some((row) => row.dataset.position === "QB")).toBe(true);
    expect(rows.some((row) => row.dataset.position === "SUPERFLEX")).toBe(true);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getAllByTestId("own-roster-slot-row").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "mock-search-select" })[0]!);
    await user.click(screen.getByRole("button", { name: /finish/i }));

    expect(createCustomLeagueActionMock).toHaveBeenCalledWith({
      name: "The Dynasty",
      teamCount: 10,
      mode: "DYNASTY",
      scoringSettings: expect.objectContaining({ rec: 1 }),
      rosterConstruction: expect.objectContaining({ QB: 1, SUPERFLEX: 1 }),
      myTeamRoster: [{ canonicalPlayerId: expect.any(String), rosterSlot: "QB" }],
    });
  });

  it("lets the user skip filling in their own roster, finishing with no myTeamRoster", async () => {
    const createCustomLeagueActionMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CreateCustomLeagueWizard createCustomLeagueAction={createCustomLeagueActionMock} />);

    await user.type(screen.getByLabelText(/league name/i), "The Dynasty");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(createCustomLeagueActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "The Dynasty", myTeamRoster: undefined }),
    );
  });
});
