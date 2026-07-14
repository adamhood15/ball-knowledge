import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";

describe("TeamRosterCard", () => {
  it("lists starters before bench players and shows the team's display name", () => {
    render(
      <TeamRosterCard
        teamName="Alice's Aces"
        players={[
          { canonicalPlayerId: "101", name: "Bench Guy", position: "WR", isStarter: false },
          { canonicalPlayerId: "100", name: "Starter Guy", position: "RB", isStarter: true },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alice's Aces" })).toBeInTheDocument();
    const playerNames = screen.getAllByTestId("roster-player-name").map((el) => el.textContent);
    expect(playerNames).toEqual(["Starter Guy", "Bench Guy"]);
  });

  it("falls back to the canonical player ID when a player hasn't been crosswalked yet", () => {
    render(
      <TeamRosterCard
        teamName="Team X"
        players={[{ canonicalPlayerId: "999", name: null, position: null, isStarter: true }]}
      />,
    );

    expect(screen.getByText(/999/)).toBeInTheDocument();
  });
});
