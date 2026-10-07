import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TradeWizard } from "@/components/trade/TradeWizard";

vi.mock("@/components/trade/PlayerSearchInput", () => ({
  PlayerSearchInput: ({ onSelectPlayer }: { onSelectPlayer: (p: unknown) => void }) => (
    <button
      type="button"
      onClick={() => onSelectPlayer({ canonicalPlayerId: "1", name: "P1", position: "RB", nflTeam: "SF" })}
    >
      mock-search-add
    </button>
  ),
}));

describe("TradeWizard", () => {
  it("starts on the setup step", () => {
    render(<TradeWizard leagues={[]} />);

    expect(screen.getByRole("link", { name: /sync a league/i })).toBeInTheDocument();
  });

  it("advances from setup straight to the search step when a league is selected", async () => {
    const user = userEvent.setup();
    render(<TradeWizard leagues={[{ id: "league-1", name: "Dynasty Warriors", mode: "DYNASTY" }]} />);

    await user.click(screen.getByRole("button", { name: /Dynasty Warriors/ }));

    expect(screen.getByText("You Give")).toBeInTheDocument();
    expect(screen.getByText("You Get")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dynasty Warriors/ })).not.toBeInTheDocument();
  });

  it("advances from setup to custom settings, then to the search step, when going custom", async () => {
    const user = userEvent.setup();
    render(<TradeWizard leagues={[]} />);

    await user.click(screen.getByRole("button", { name: /quick.*valuation/i }));
    expect(screen.getByRole("button", { name: "Redraft" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dynasty" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("You Give")).toBeInTheDocument();
  });

  it("lets a user with synced leagues opt into custom settings instead", async () => {
    const user = userEvent.setup();
    render(<TradeWizard leagues={[{ id: "league-1", name: "Dynasty Warriors", mode: "DYNASTY" }]} />);

    await user.click(screen.getByRole("button", { name: /use custom settings instead/i }));

    expect(screen.getByRole("button", { name: "Redraft" })).toBeInTheDocument();
  });

  it("advances to the results step after analyzing a trade with players on both sides", async () => {
    const user = userEvent.setup();
    render(<TradeWizard leagues={[{ id: "league-1", name: "Dynasty Warriors", mode: "DYNASTY" }]} />);

    await user.click(screen.getByRole("button", { name: /Dynasty Warriors/ }));
    const searchButtons = screen.getAllByRole("button", { name: "mock-search-add" });
    await user.click(searchButtons[0]!);
    await user.click(searchButtons[1]!);
    await user.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByTestId("trade-results-step-placeholder")).toBeInTheDocument();
  });
});
