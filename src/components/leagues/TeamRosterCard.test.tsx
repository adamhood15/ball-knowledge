import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";

describe("TeamRosterCard", () => {
  it("shows the roster slot on the left and player name on the right for starters, in slot order", () => {
    render(
      <TeamRosterCard
        teamName="Alice's Aces"
        players={[
          { canonicalPlayerId: "100", name: "Starter QB", position: "QB", rosterSlot: "QB" },
          { canonicalPlayerId: "101", name: "Starter Flex", position: "WR", rosterSlot: "FLEX" },
          { canonicalPlayerId: "102", name: "Bench Guy", position: "RB", rosterSlot: null },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Alice's Aces" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    // Row 0: QB starter, Row 1: FLEX starter, Row 2: "Bench" separator, Row 3: bench player
    expect(rows[0]).toHaveTextContent("QB");
    expect(rows[0]).toHaveTextContent("Starter QB");
    expect(rows[1]).toHaveTextContent("FLEX");
    expect(rows[1]).toHaveTextContent("Starter Flex");
    expect(rows[2]).toHaveTextContent(/bench/i);
    expect(rows[3]).toHaveTextContent("RB");
    expect(rows[3]).toHaveTextContent("Bench Guy");
  });

  it("omits the bench separator row when there are no bench players", () => {
    render(
      <TeamRosterCard
        teamName="Team X"
        players={[{ canonicalPlayerId: "100", name: "Starter QB", position: "QB", rosterSlot: "QB" }]}
      />,
    );

    expect(screen.queryByText(/bench/i)).not.toBeInTheDocument();
  });

  it("falls back to the canonical player ID when a player hasn't been crosswalked yet", () => {
    render(
      <TeamRosterCard
        teamName="Team X"
        players={[{ canonicalPlayerId: "999", name: null, position: null, rosterSlot: "QB" }]}
      />,
    );

    expect(screen.getByText(/999/)).toBeInTheDocument();
  });
});
