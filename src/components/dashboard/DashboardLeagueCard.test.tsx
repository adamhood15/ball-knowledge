import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardLeagueCard } from "@/components/dashboard/DashboardLeagueCard";

const deleteLeagueActionMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/leagues/[leagueId]/actions", () => ({
  deleteLeagueAction: deleteLeagueActionMock,
}));

describe("DashboardLeagueCard", () => {
  afterEach(() => {
    deleteLeagueActionMock.mockReset();
    vi.restoreAllMocks();
  });

  it("links to the league's page and shows its name", () => {
    render(<DashboardLeagueCard leagueId="league-1" name="Dynasty Warriors" platform="SLEEPER" mode="DYNASTY" />);

    const link = screen.getByText("Dynasty Warriors").closest("a");
    expect(link).toHaveAttribute("href", "/leagues/league-1");
  });

  it("shows a platform icon", () => {
    render(<DashboardLeagueCard leagueId="league-1" name="Dynasty Warriors" platform="SLEEPER" mode="DYNASTY" />);

    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("asks for confirmation, then deletes the league when confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteLeagueActionMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<DashboardLeagueCard leagueId="league-1" name="Dynasty Warriors" platform="SLEEPER" mode="DYNASTY" />);

    await user.click(screen.getByRole("button", { name: /remove dynasty warriors/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteLeagueActionMock).toHaveBeenCalledWith("league-1");
  });

  it("does not delete the league when the confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<DashboardLeagueCard leagueId="league-1" name="Dynasty Warriors" platform="SLEEPER" mode="DYNASTY" />);

    await user.click(screen.getByRole("button", { name: /remove dynasty warriors/i }));

    expect(deleteLeagueActionMock).not.toHaveBeenCalled();
  });
});
