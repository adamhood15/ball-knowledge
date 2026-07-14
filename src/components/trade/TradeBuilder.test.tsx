import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeBuilder } from "@/components/trade/TradeBuilder";

const myTeam = {
  teamName: "Alice's Aces",
  players: [{ canonicalPlayerId: "1", name: "Jayden Daniels", position: "QB", nflTeam: "WAS" }],
};
const opponentTeam = {
  teamName: "Bob's Team",
  players: [{ canonicalPlayerId: "2", name: "Josh Jacobs", position: "RB", nflTeam: "GB" }],
};

describe("TradeBuilder", () => {
  it("does not show the proposal footer until at least one player is selected", () => {
    render(<TradeBuilder myTeam={myTeam} opponentTeam={opponentTeam} />);

    expect(screen.queryByRole("button", { name: /view proposal/i })).not.toBeInTheDocument();
  });

  it("shows the sticky footer once a player is selected from either side", async () => {
    const user = userEvent.setup();
    render(<TradeBuilder myTeam={myTeam} opponentTeam={opponentTeam} />);

    await user.click(screen.getByText("Jayden Daniels"));

    expect(screen.getByRole("button", { name: /view proposal/i })).toBeInTheDocument();
  });

  it("expands the proposal panel listing selected players from both sides, with an Analyze Trade action", async () => {
    const user = userEvent.setup();
    render(<TradeBuilder myTeam={myTeam} opponentTeam={opponentTeam} />);

    await user.click(screen.getByText("Jayden Daniels"));
    await user.click(screen.getByText("Josh Jacobs"));
    await user.click(screen.getByRole("button", { name: /view proposal/i }));

    expect(screen.getByRole("button", { name: /analyze trade/i })).toBeInTheDocument();
    const proposalPanel = screen.getByTestId("trade-proposal-panel");
    expect(proposalPanel).toHaveTextContent("Jayden Daniels");
    expect(proposalPanel).toHaveTextContent("Josh Jacobs");
  });
});
