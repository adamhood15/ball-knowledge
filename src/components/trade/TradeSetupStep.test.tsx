import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeSetupStep } from "@/components/trade/TradeSetupStep";

describe("TradeSetupStep", () => {
  describe("when the user has no synced leagues", () => {
    it("offers to sync a league, linking to the dashboard", () => {
      render(<TradeSetupStep leagues={[]} onSelectLeague={vi.fn()} onUseCustomSettings={vi.fn()} />);

      expect(screen.getByRole("link", { name: /sync a league/i })).toHaveAttribute("href", "/dashboard");
    });

    it("offers a quick custom valuation that calls onUseCustomSettings", async () => {
      const onUseCustomSettingsMock = vi.fn();
      const user = userEvent.setup();
      render(<TradeSetupStep leagues={[]} onSelectLeague={vi.fn()} onUseCustomSettings={onUseCustomSettingsMock} />);

      await user.click(screen.getByRole("button", { name: /quick.*valuation/i }));

      expect(onUseCustomSettingsMock).toHaveBeenCalled();
    });

    it("does not show a league picker", () => {
      render(<TradeSetupStep leagues={[]} onSelectLeague={vi.fn()} onUseCustomSettings={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /use custom settings instead/i })).not.toBeInTheDocument();
    });
  });

  describe("when the user has synced leagues", () => {
    const leagues = [
      { id: "league-1", name: "Dynasty Warriors", mode: "DYNASTY" as const },
      { id: "league-2", name: "Redraft Rebels", mode: "REDRAFT" as const },
    ];

    it("lists every league by name", () => {
      render(<TradeSetupStep leagues={leagues} onSelectLeague={vi.fn()} onUseCustomSettings={vi.fn()} />);

      expect(screen.getByRole("button", { name: /Dynasty Warriors/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Redraft Rebels/ })).toBeInTheDocument();
    });

    it("calls onSelectLeague with the chosen league's ID", async () => {
      const onSelectLeagueMock = vi.fn();
      const user = userEvent.setup();
      render(<TradeSetupStep leagues={leagues} onSelectLeague={onSelectLeagueMock} onUseCustomSettings={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /Dynasty Warriors/ }));

      expect(onSelectLeagueMock).toHaveBeenCalledWith("league-1");
    });

    it("still offers a custom settings option instead of a league", async () => {
      const onUseCustomSettingsMock = vi.fn();
      const user = userEvent.setup();
      render(<TradeSetupStep leagues={leagues} onSelectLeague={vi.fn()} onUseCustomSettings={onUseCustomSettingsMock} />);

      await user.click(screen.getByRole("button", { name: /use custom settings instead/i }));

      expect(onUseCustomSettingsMock).toHaveBeenCalled();
    });

    it("does not offer the sync-a-league link when leagues already exist", () => {
      render(<TradeSetupStep leagues={leagues} onSelectLeague={vi.fn()} onUseCustomSettings={vi.fn()} />);

      expect(screen.queryByRole("link", { name: /sync a league/i })).not.toBeInTheDocument();
    });
  });
});
