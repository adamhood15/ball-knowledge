import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RosterConstructionForm } from "@/components/leagues/RosterConstructionForm";

describe("RosterConstructionForm", () => {
  const standardOneQbConstruction = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 };

  it("renders a count input per configured slot", () => {
    render(
      <RosterConstructionForm
        leagueId="league-1"
        initialRosterConstruction={standardOneQbConstruction}
        updateRosterConstructionAction={vi.fn()}
      />,
    );

    expect(screen.getByTestId("roster-slot-count-QB")).toHaveValue(1);
    expect(screen.getByTestId("roster-slot-count-RB")).toHaveValue(2);
    expect(screen.getByTestId("roster-slot-count-BENCH")).toHaveValue(6);
  });

  it("supports a non-standard construction, e.g. raising QB to 2 for a two-QB/superflex league", async () => {
    const user = userEvent.setup();
    const updateRosterConstructionActionMock = vi.fn().mockResolvedValue(undefined);
    render(
      <RosterConstructionForm
        leagueId="league-1"
        initialRosterConstruction={standardOneQbConstruction}
        updateRosterConstructionAction={updateRosterConstructionActionMock}
      />,
    );

    const qbInput = screen.getByTestId("roster-slot-count-QB");
    await user.clear(qbInput);
    await user.type(qbInput, "2");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateRosterConstructionActionMock).toHaveBeenCalledWith("league-1", expect.objectContaining({ QB: 2 }));
  });

  it("allows adding a custom slot type, e.g. SUPER_FLEX, not in the initial construction", async () => {
    const user = userEvent.setup();
    const updateRosterConstructionActionMock = vi.fn().mockResolvedValue(undefined);
    render(
      <RosterConstructionForm
        leagueId="league-1"
        initialRosterConstruction={standardOneQbConstruction}
        updateRosterConstructionAction={updateRosterConstructionActionMock}
      />,
    );

    await user.type(screen.getByTestId("new-slot-name"), "SUPER_FLEX");
    await user.click(screen.getByRole("button", { name: /add slot/i }));
    expect(screen.getByTestId("roster-slot-count-SUPER_FLEX")).toHaveValue(1);

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(updateRosterConstructionActionMock).toHaveBeenCalledWith(
      "league-1",
      expect.objectContaining({ SUPER_FLEX: 1 }),
    );
  });

  it("allows removing a slot type entirely", async () => {
    const user = userEvent.setup();
    const updateRosterConstructionActionMock = vi.fn().mockResolvedValue(undefined);
    render(
      <RosterConstructionForm
        leagueId="league-1"
        initialRosterConstruction={standardOneQbConstruction}
        updateRosterConstructionAction={updateRosterConstructionActionMock}
      />,
    );

    await user.click(screen.getByTestId("roster-slot-remove-K"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    const savedConstruction = updateRosterConstructionActionMock.mock.calls[0]![1];
    expect(savedConstruction).not.toHaveProperty("K");
  });
});
