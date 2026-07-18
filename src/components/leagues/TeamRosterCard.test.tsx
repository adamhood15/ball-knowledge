import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";
import { getDummyByeWeek, getDummyValueScore } from "@/lib/design/dummyPlayerStats";

describe("TeamRosterCard", () => {
  it("shows the roster slot and player name for starters, in slot order, no team-name heading", () => {
    render(
      <TeamRosterCard
        players={[
          { canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" },
          { canonicalPlayerId: "101", name: "Starter Flex", position: "WR", nflTeam: "MIA", rosterSlot: "FLEX" },
          { canonicalPlayerId: "102", name: "Bench Guy", position: "RB", nflTeam: "SF", rosterSlot: null },
        ]}
      />,
    );

    // The team name is shown by the page, not this card — no heading role should exist here.
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    const rows = screen.getAllByTestId("roster-player-row");
    expect(rows[0]).toHaveTextContent("QB");
    expect(rows[0]).toHaveTextContent("Starter QB");
    expect(rows[1]).toHaveTextContent("FLEX");
    expect(rows[1]).toHaveTextContent("Starter Flex");
    expect(screen.getByTestId("bench-separator")).toBeInTheDocument();
    expect(rows[2]).toHaveTextContent("RB");
    expect(rows[2]).toHaveTextContent("Bench Guy");
  });

  it("shows each player's NFL team abbreviation and a dummy bye week", () => {
    render(
      <TeamRosterCard
        players={[
          { canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" },
        ]}
      />,
    );

    const row = screen.getByTestId("roster-player-row");
    expect(row).toHaveTextContent("KC");
    expect(row).toHaveTextContent(`Bye ${getDummyByeWeek("100")}`);
  });

  it("shows a headshot and a color-coded dummy value score per player", () => {
    render(
      <TeamRosterCard
        players={[
          { canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" },
        ]}
      />,
    );

    expect(screen.getByTestId("player-headshot-image")).toHaveAttribute(
      "src",
      "https://sleepercdn.com/content/nfl/players/thumb/100.jpg",
    );
    expect(screen.getByTestId("player-value-score")).toHaveTextContent(String(getDummyValueScore("100")));
  });

  it("uses the team logo, not a player headshot, for a DEF roster entry", () => {
    render(
      <TeamRosterCard
        players={[{ canonicalPlayerId: "KC", name: "Kansas City Chiefs", position: "DEF", nflTeam: "KC", rosterSlot: "DEF" }]}
      />,
    );

    expect(screen.getByTestId("player-headshot-image")).toHaveAttribute(
      "src",
      "https://sleepercdn.com/images/team_logos/nfl/kc.png",
    );
  });

  it("omits the bench separator row when there are no bench players", () => {
    render(
      <TeamRosterCard
        players={[{ canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" }]}
      />,
    );

    expect(screen.queryByTestId("bench-separator")).not.toBeInTheDocument();
  });

  it("falls back to the canonical player ID when a player hasn't been crosswalked yet", () => {
    render(
      <TeamRosterCard
        players={[{ canonicalPlayerId: "999", name: null, position: null, nflTeam: null, rosterSlot: "QB" }]}
      />,
    );

    expect(screen.getByText(/999/)).toBeInTheDocument();
  });

  it("never renders a border, so both My Team and other-team roster views look identical", () => {
    render(
      <TeamRosterCard
        players={[{ canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" }]}
      />,
    );

    expect(screen.getByTestId("roster-card")).not.toHaveClass("border");
  });
});
