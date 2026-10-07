import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeAssetColumn } from "@/components/trade/TradeAssetColumn";

vi.mock("@/components/trade/PlayerSearchInput", () => ({
  PlayerSearchInput: ({ onSelectPlayer }: { onSelectPlayer: (p: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelectPlayer({ canonicalPlayerId: "new-id", name: "New Player", position: "RB", nflTeam: "SF" })
      }
    >
      mock-search-add
    </button>
  ),
}));

const samplePlayer = { canonicalPlayerId: "100", name: "Ja'Marr Chase", position: "WR", nflTeam: "CIN" };

describe("TradeAssetColumn", () => {
  it("shows the label and each added player as a card", () => {
    render(
      <TradeAssetColumn label="You Give" assets={[samplePlayer]} onAddPlayer={vi.fn()} onRemovePlayer={vi.fn()} />,
    );

    expect(screen.getByText("You Give")).toBeInTheDocument();
    expect(screen.getByTestId("trade-asset-card")).toHaveTextContent("Ja'Marr Chase");
  });

  it("calls onRemovePlayer with the player's ID when its remove button is clicked", async () => {
    const onRemovePlayerMock = vi.fn();
    const user = userEvent.setup();
    render(
      <TradeAssetColumn
        label="You Give"
        assets={[samplePlayer]}
        onAddPlayer={vi.fn()}
        onRemovePlayer={onRemovePlayerMock}
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove ja'marr chase/i }));

    expect(onRemovePlayerMock).toHaveBeenCalledWith("100");
  });

  it("shows the search input when under the 5-player cap", () => {
    render(<TradeAssetColumn label="You Give" assets={[]} onAddPlayer={vi.fn()} onRemovePlayer={vi.fn()} />);

    expect(screen.getByText("mock-search-add")).toBeInTheDocument();
  });

  it("hides the search input and shows a cap message once 5 players are added", () => {
    const fivePlayers = Array.from({ length: 5 }, (_, i) => ({
      canonicalPlayerId: String(i),
      name: `Player ${i}`,
      position: "WR",
      nflTeam: "SF",
    }));
    render(<TradeAssetColumn label="You Give" assets={fivePlayers} onAddPlayer={vi.fn()} onRemovePlayer={vi.fn()} />);

    expect(screen.queryByText("mock-search-add")).not.toBeInTheDocument();
    expect(screen.getByText(/maximum of 5/i)).toBeInTheDocument();
  });

  it("calls onAddPlayer when the search input reports a selection", async () => {
    const onAddPlayerMock = vi.fn();
    const user = userEvent.setup();
    render(<TradeAssetColumn label="You Give" assets={[]} onAddPlayer={onAddPlayerMock} onRemovePlayer={vi.fn()} />);

    await user.click(screen.getByText("mock-search-add"));

    expect(onAddPlayerMock).toHaveBeenCalledWith({
      canonicalPlayerId: "new-id",
      name: "New Player",
      position: "RB",
      nflTeam: "SF",
    });
  });
});
