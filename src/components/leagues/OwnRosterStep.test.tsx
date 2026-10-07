import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OwnRosterStep } from "@/components/leagues/OwnRosterStep";

// Derives a deterministic fake player from the stable `placeholder` prop (unique per slot)
// rather than an incrementing counter, since a counter recomputed on every render drifts
// whenever an unrelated sibling re-renders (React re-invokes every mock instance's body).
vi.mock("@/components/trade/PlayerSearchInput", () => ({
  PlayerSearchInput: ({
    onSelectPlayer,
    placeholder,
  }: {
    onSelectPlayer: (p: unknown) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelectPlayer({ canonicalPlayerId: placeholder, name: `Player for ${placeholder}`, position: "RB", nflTeam: "SF" })
      }
    >
      mock-search-select
    </button>
  ),
}));

describe("OwnRosterStep", () => {
  it("renders one search row per configured slot, in fixed order", () => {
    render(<OwnRosterStep rosterConstruction={{ QB: 1, RB: 2 }} onContinue={vi.fn()} onSkip={vi.fn()} />);

    const rows = screen.getAllByTestId("own-roster-slot-row");
    expect(rows.map((row) => row.dataset.slot)).toEqual(["QB", "RB", "RB"]);
  });

  it("shows the selected player's name for a slot once chosen", async () => {
    const user = userEvent.setup();
    render(<OwnRosterStep rosterConstruction={{ QB: 1 }} onContinue={vi.fn()} onSkip={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "mock-search-select" }));

    expect(screen.getByText(/player for/i)).toBeInTheDocument();
  });

  it("calling onSkip requires no selections", async () => {
    const onSkipMock = vi.fn();
    const user = userEvent.setup();
    render(<OwnRosterStep rosterConstruction={{ QB: 1 }} onContinue={vi.fn()} onSkip={onSkipMock} />);

    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(onSkipMock).toHaveBeenCalled();
  });

  it("passes selected players to onContinue, mapping BENCH slots to a null rosterSlot", async () => {
    const onContinueMock = vi.fn();
    const user = userEvent.setup();
    render(
      <OwnRosterStep rosterConstruction={{ QB: 1, BENCH: 1 }} onContinue={onContinueMock} onSkip={vi.fn()} />,
    );

    const selectButtons = screen.getAllByRole("button", { name: "mock-search-select" });
    await user.click(selectButtons[0]!);
    await user.click(selectButtons[1]!);
    await user.click(screen.getByRole("button", { name: /finish|continue/i }));

    expect(onContinueMock).toHaveBeenCalledWith([
      { canonicalPlayerId: "Search for a QB…", rosterSlot: "QB" },
      { canonicalPlayerId: "Search for a BENCH…", rosterSlot: null },
    ]);
  });

  it("continues successfully with zero players selected", async () => {
    const onContinueMock = vi.fn();
    const user = userEvent.setup();
    render(<OwnRosterStep rosterConstruction={{ QB: 1 }} onContinue={onContinueMock} onSkip={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /finish|continue/i }));

    expect(onContinueMock).toHaveBeenCalledWith([]);
  });
});
