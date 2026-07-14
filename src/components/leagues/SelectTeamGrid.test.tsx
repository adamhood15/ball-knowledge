import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectTeamGrid } from "@/components/leagues/SelectTeamGrid";

describe("SelectTeamGrid", () => {
  it("claims the clicked team", async () => {
    const claimTeamActionMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <SelectTeamGrid
        leagueId="league-1"
        teams={[
          { teamId: "team-1", teamName: "Alice's Aces", avatarUrl: null },
          { teamId: "team-2", teamName: "Bob's Team", avatarUrl: null },
        ]}
        claimTeamAction={claimTeamActionMock}
      />,
    );

    await user.click(screen.getByText("Bob's Team"));

    expect(claimTeamActionMock).toHaveBeenCalledWith("league-1", "team-2");
  });
});
