import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimTeamButton } from "@/components/leagues/ClaimTeamButton";

describe("ClaimTeamButton", () => {
  it("calls the claim action with the league and team IDs when clicked", async () => {
    const claimTeamActionMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ClaimTeamButton leagueId="league-1" teamId="team-1" claimTeamAction={claimTeamActionMock} />);

    await user.click(screen.getByRole("button", { name: /this is my team/i }));

    expect(claimTeamActionMock).toHaveBeenCalledWith("league-1", "team-1");
  });
});
