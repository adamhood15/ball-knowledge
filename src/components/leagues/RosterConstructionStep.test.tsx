import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RosterConstructionStep } from "@/components/leagues/RosterConstructionStep";

describe("RosterConstructionStep", () => {
  it("renders one row per instance, in a fixed QB/RB/WR/TE/FLEX/SUPERFLEX/K/DEF/BENCH order", () => {
    render(
      <RosterConstructionStep
        initialRosterConstruction={{ QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 }}
        onContinue={vi.fn()}
      />,
    );

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(rows.map((row) => row.dataset.position)).toEqual(["QB", "RB", "RB", "WR", "WR", "TE", "K", "DEF"]);
  });

  it("omits a position entirely when its count is zero", () => {
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1 }} onContinue={vi.fn()} />);

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.dataset.position).toBe("QB");
  });

  it("shows no numeric count anywhere in a row", () => {
    render(<RosterConstructionStep initialRosterConstruction={{ RB: 2 }} onContinue={vi.fn()} />);

    const rows = screen.getAllByTestId("roster-slot-row");
    for (const row of rows) {
      expect(row).not.toHaveTextContent(/\d/);
    }
  });

  it("color-codes each real position the same way the trade pages do", () => {
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, RB: 1 }} onContinue={vi.fn()} />);

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(within(rows[0]!).getByText("QB")).toHaveClass("text-red-400");
    expect(within(rows[1]!).getByText("RB")).toHaveClass("text-blue-400");
  });

  it("has no free-text slot name input or Add Slot button", () => {
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1 }} onContinue={vi.fn()} />);

    expect(screen.queryByTestId("new-slot-name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add slot/i })).not.toBeInTheDocument();
  });

  it("adds another row of the same position directly below when + is clicked", async () => {
    const user = userEvent.setup();
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, RB: 2, WR: 1 }} onContinue={vi.fn()} />);

    const rbAddButtons = screen.getAllByRole("button", { name: /add another rb/i });
    await user.click(rbAddButtons[0]!);

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(rows.map((row) => row.dataset.position)).toEqual(["QB", "RB", "RB", "RB", "WR"]);
  });

  it("removes one row of that position when - is clicked", async () => {
    const user = userEvent.setup();
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, RB: 2 }} onContinue={vi.fn()} />);

    const rbRemoveButtons = screen.getAllByRole("button", { name: /remove a rb/i });
    await user.click(rbRemoveButtons[0]!);

    const rows = screen.getAllByTestId("roster-slot-row");
    expect(rows.map((row) => row.dataset.position)).toEqual(["QB", "RB"]);
  });

  it("removes the position entirely once its last row is removed", async () => {
    const user = userEvent.setup();
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, DEF: 1 }} onContinue={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /remove a def/i }));

    expect(screen.queryAllByTestId("roster-slot-row").map((row) => row.dataset.position)).toEqual(["QB"]);
  });

  it("passes the resulting position counts to onContinue", async () => {
    const onContinueMock = vi.fn();
    const user = userEvent.setup();
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, RB: 1 }} onContinue={onContinueMock} />);

    await user.click(screen.getByRole("button", { name: /add another rb/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onContinueMock).toHaveBeenCalledWith({ QB: 1, RB: 2 });
  });

  it("gives + and - the row's own position color instead of a fixed pink/cyan pair", () => {
    render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, RB: 1 }} onContinue={vi.fn()} />);

    const qbAdd = screen.getByRole("button", { name: /add another qb/i });
    const qbRemove = screen.getByRole("button", { name: /remove a qb/i });
    const rbAdd = screen.getByRole("button", { name: /add another rb/i });

    expect(qbAdd).not.toHaveClass("bg-secondary-accent");
    expect(qbRemove).not.toHaveClass("bg-card-border");
    expect(qbAdd).toHaveClass("text-red-400");
    expect(qbRemove).toHaveClass("text-red-400");
    expect(rbAdd).toHaveClass("text-blue-400");
    expect(qbAdd.className).not.toBe(rbAdd.className);
  });

  describe("available positions tray", () => {
    it("shows a card for a position only once it has zero rows", () => {
      render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, DEF: 0 }} onContinue={vi.fn()} />);

      expect(screen.getByTestId("available-position-DEF")).toBeInTheDocument();
      expect(screen.queryByTestId("available-position-QB")).not.toBeInTheDocument();
    });

    it("clicking an available position's card adds it back to the roster, sorted into its default place", () => {
      render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, WR: 1, DEF: 0 }} onContinue={vi.fn()} />);

      fireEvent.click(screen.getByTestId("available-position-DEF"));

      const rows = screen.getAllByTestId("roster-slot-row");
      expect(rows.map((row) => row.dataset.position)).toEqual(["QB", "WR", "DEF"]);
      expect(screen.queryByTestId("available-position-DEF")).not.toBeInTheDocument();
    });

    it("dropping a dragged available position onto the roster list adds it back", () => {
      render(<RosterConstructionStep initialRosterConstruction={{ QB: 1, DEF: 0 }} onContinue={vi.fn()} />);

      const card = screen.getByTestId("available-position-DEF");
      expect(card).toHaveAttribute("draggable", "true");

      const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => "DEF") };
      fireEvent.dragStart(card, { dataTransfer });
      const dropZone = screen.getByTestId("roster-slot-list");
      fireEvent.dragOver(dropZone, { dataTransfer });
      fireEvent.drop(dropZone, { dataTransfer });

      const rows = screen.getAllByTestId("roster-slot-row");
      expect(rows.map((row) => row.dataset.position)).toEqual(["QB", "DEF"]);
    });
  });
});
