import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomSettingsStep } from "@/components/trade/CustomSettingsStep";

describe("CustomSettingsStep", () => {
  it("defaults to Redraft, 1QB, TE Premium off, and PPR", () => {
    render(<CustomSettingsStep onContinue={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Redraft" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "1QB" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Off" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "PPR" })).toHaveAttribute("aria-pressed", "true");
  });

  it("lets the user change each setting independently", async () => {
    const user = userEvent.setup();
    render(<CustomSettingsStep onContinue={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Dynasty" }));
    await user.click(screen.getByRole("button", { name: "Superflex" }));
    await user.click(screen.getByRole("button", { name: "On" }));
    await user.click(screen.getByRole("button", { name: "Half-PPR" }));

    expect(screen.getByRole("button", { name: "Dynasty" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Superflex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "On" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Half-PPR" })).toHaveAttribute("aria-pressed", "true");
  });

  it("passes the full settings object to onContinue when continuing", async () => {
    const onContinueMock = vi.fn();
    const user = userEvent.setup();
    render(<CustomSettingsStep onContinue={onContinueMock} />);

    await user.click(screen.getByRole("button", { name: "Dynasty" }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onContinueMock).toHaveBeenCalledWith({
      leagueType: "DYNASTY",
      qbFormat: "ONE_QB",
      tePremium: "OFF",
      scoring: "PPR",
    });
  });
});
