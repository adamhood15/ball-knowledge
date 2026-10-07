import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamRosterCard, type TeamRosterPlayer } from "@/components/leagues/TeamRosterCard";
import { getDummyValueScore } from "@/lib/design/dummyPlayerStats";

const player = (overrides: Partial<TeamRosterPlayer> & Pick<TeamRosterPlayer, "canonicalPlayerId">): TeamRosterPlayer => ({
  name: "Starter QB",
  position: "QB",
  nflTeam: "KC",
  byeWeek: 10,
  projectedValue: null,
  rosterSlot: "QB",
  ...overrides,
});

describe("TeamRosterCard", () => {
  it("shows the roster slot and player name for starters, in slot order, no team-name heading", () => {
    render(
      <TeamRosterCard
        players={[
          player({ canonicalPlayerId: "100", name: "Starter QB", position: "QB", nflTeam: "KC", rosterSlot: "QB" }),
          player({ canonicalPlayerId: "101", name: "Starter Flex", position: "WR", nflTeam: "MIA", rosterSlot: "FLEX" }),
          player({ canonicalPlayerId: "102", name: "Bench Guy", position: "RB", nflTeam: "SF", rosterSlot: null }),
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

  it("shows each player's NFL team abbreviation and their real bye week", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100", nflTeam: "KC", byeWeek: 5 })]} />);

    const row = screen.getByTestId("roster-player-row");
    expect(row).toHaveTextContent("KC");
    expect(row).toHaveTextContent("Bye 5");
  });

  it("omits the bye week entirely when it hasn't been backfilled yet, rather than showing a placeholder", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100", byeWeek: null })]} />);

    const row = screen.getByTestId("roster-player-row");
    expect(row).not.toHaveTextContent("Bye");
  });

  it("shows a headshot and a color-coded dummy value score per player", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100" })]} />);

    expect(screen.getByTestId("player-headshot-image")).toHaveAttribute(
      "src",
      "https://sleepercdn.com/content/nfl/players/thumb/100.jpg",
    );
    expect(screen.getByTestId("player-value-score")).toHaveTextContent(String(getDummyValueScore("100")));
  });

  it("shows the real projected value to the left of the placeholder value score when available", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100", projectedValue: 142.34 })]} />);

    const row = screen.getByTestId("roster-player-row");
    const projectedValueEl = screen.getByTestId("player-projected-value");
    const valueScoreEl = screen.getByTestId("player-value-score");

    expect(projectedValueEl).toHaveTextContent("142.3");
    // "to the left of" == earlier in DOM order within the row, given the row's left-to-right flex layout.
    const rowChildrenPosition = Array.from(row.querySelectorAll("*"));
    expect(rowChildrenPosition.indexOf(projectedValueEl)).toBeLessThan(rowChildrenPosition.indexOf(valueScoreEl));
  });

  it("shows nothing for the projected value when it isn't available yet, rather than a blank badge", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100", projectedValue: null })]} />);

    expect(screen.queryByTestId("player-projected-value")).not.toBeInTheDocument();
  });

  it("uses the team logo, not a player headshot, for a DEF roster entry", () => {
    render(
      <TeamRosterCard
        players={[player({ canonicalPlayerId: "KC", name: "Kansas City Chiefs", position: "DEF", nflTeam: "KC", rosterSlot: "DEF" })]}
      />,
    );

    expect(screen.getByTestId("player-headshot-image")).toHaveAttribute(
      "src",
      "https://sleepercdn.com/images/team_logos/nfl/kc.png",
    );
  });

  it("omits the bench separator row when there are no bench players", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100" })]} />);

    expect(screen.queryByTestId("bench-separator")).not.toBeInTheDocument();
  });

  it("falls back to the canonical player ID when a player hasn't been crosswalked yet", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "999", name: null, position: null, nflTeam: null })]} />);

    expect(screen.getByText(/999/)).toBeInTheDocument();
  });

  it("never renders a border, so both My Team and other-team roster views look identical", () => {
    render(<TeamRosterCard players={[player({ canonicalPlayerId: "100" })]} />);

    expect(screen.getByTestId("roster-card")).not.toHaveClass("border");
  });
});
