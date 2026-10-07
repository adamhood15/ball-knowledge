import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoringSettingsForm } from "@/components/leagues/ScoringSettingsForm";

describe("ScoringSettingsForm", () => {
  const initialScoringSettings = { rec: 0.5, rec_yd: 0.1, pass_td: 4 };

  it("selecting the PPR preset sets the reception input to 1", async () => {
    const user = userEvent.setup();
    render(
      <ScoringSettingsForm
        leagueId="league-1"
        initialScoringSettings={initialScoringSettings}
        updateScoringSettingsAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "PPR" }));

    expect(screen.getByTestId("scoring-input-rec")).toHaveValue(1);
  });

  it("selecting the Standard preset sets the reception input to 0", async () => {
    const user = userEvent.setup();
    render(
      <ScoringSettingsForm
        leagueId="league-1"
        initialScoringSettings={initialScoringSettings}
        updateScoringSettingsAction={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Standard" }));

    expect(screen.getByTestId("scoring-input-rec")).toHaveValue(0);
  });

  it("allows a manual override of an individual stat category independent of any preset", async () => {
    const user = userEvent.setup();
    render(
      <ScoringSettingsForm
        leagueId="league-1"
        initialScoringSettings={initialScoringSettings}
        updateScoringSettingsAction={vi.fn()}
      />,
    );

    const passTdInput = screen.getByTestId("scoring-input-pass_td");
    await user.clear(passTdInput);
    await user.type(passTdInput, "6");

    expect(passTdInput).toHaveValue(6);
  });

  it("saves the current edited settings, including manual overrides made after a preset", async () => {
    const updateScoringSettingsActionMock = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ScoringSettingsForm
        leagueId="league-1"
        initialScoringSettings={initialScoringSettings}
        updateScoringSettingsAction={updateScoringSettingsActionMock}
      />,
    );

    await user.click(screen.getByRole("button", { name: "PPR" }));
    const passTdInput = screen.getByTestId("scoring-input-pass_td");
    await user.clear(passTdInput);
    await user.type(passTdInput, "6");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateScoringSettingsActionMock).toHaveBeenCalledWith("league-1", { rec: 1, rec_yd: 0.1, pass_td: 6 });
  });
});
