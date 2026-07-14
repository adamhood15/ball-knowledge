import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamStrip } from "@/components/leagues/TeamStrip";

describe("TeamStrip", () => {
  it("links each team to its roster page and highlights the selected one", () => {
    render(
      <TeamStrip
        leagueId="league-1"
        teams={[
          { teamId: "team-1", teamName: "Alice's Aces", avatarUrl: null },
          { teamId: "team-2", teamName: "Bob's Team", avatarUrl: null },
        ]}
        selectedTeamId="team-2"
      />,
    );

    const aliceLink = screen.getByText("Alice's Aces").closest("a");
    expect(aliceLink).toHaveAttribute("href", "/leagues/league-1/teams/team-1");
    const bobLink = screen.getByText("Bob's Team").closest("a");
    expect(bobLink).toHaveAttribute("href", "/leagues/league-1/teams/team-2");
  });
});
