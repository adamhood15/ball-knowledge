import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeSearchStep } from "@/components/trade/TradeSearchStep";

vi.mock("@/components/trade/PlayerSearchInput", () => ({
  PlayerSearchInput: ({
    onSelectPlayer,
    placeholder,
  }: {
    onSelectPlayer: (p: unknown) => void;
    placeholder?: string;
  }) => (
    <button type="button" onClick={() => onSelectPlayer({ canonicalPlayerId: "1", name: "P1", position: "RB", nflTeam: "SF" })}>
      {placeholder}
    </button>
  ),
}));

describe("TradeSearchStep", () => {
  it("renders a You Give and a You Get column", () => {
    render(<TradeSearchStep onAnalyze={vi.fn()} />);

    expect(screen.getByText("You Give")).toBeInTheDocument();
    expect(screen.getByText("You Get")).toBeInTheDocument();
  });

  it("disables Analyze until both sides have at least one player", async () => {
    const user = userEvent.setup();
    render(<TradeSearchStep onAnalyze={vi.fn()} />);

    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();

    const searchButtons = screen.getAllByRole("button", { name: /search players/i });
    await user.click(searchButtons[0]!);
    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();

    await user.click(searchButtons[1]!);
    expect(screen.getByRole("button", { name: /analyze/i })).toBeEnabled();
  });

  it("calls onAnalyze with both sides' assets when clicked", async () => {
    const onAnalyzeMock = vi.fn();
    const user = userEvent.setup();
    render(<TradeSearchStep onAnalyze={onAnalyzeMock} />);

    const searchButtons = screen.getAllByRole("button", { name: /search players/i });
    await user.click(searchButtons[0]!);
    await user.click(searchButtons[1]!);
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(onAnalyzeMock).toHaveBeenCalledWith(
      [{ canonicalPlayerId: "1", name: "P1", position: "RB", nflTeam: "SF" }],
      [{ canonicalPlayerId: "1", name: "P1", position: "RB", nflTeam: "SF" }],
    );
  });
});
