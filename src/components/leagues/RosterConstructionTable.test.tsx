import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RosterConstructionTable } from "@/components/leagues/RosterConstructionTable";

describe("RosterConstructionTable", () => {
  it("shows each slot and its count", () => {
    render(<RosterConstructionTable rosterConstruction={{ QB: 1, RB: 2, BENCH: 6 }} />);

    expect(screen.getByText("QB")).toBeInTheDocument();
    expect(screen.getByText("RB")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows[0]).toHaveTextContent("QB");
    expect(rows[0]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("RB");
    expect(rows[1]).toHaveTextContent("2");
  });

  it("always lists BENCH last", () => {
    render(<RosterConstructionTable rosterConstruction={{ BENCH: 6, QB: 1 }} />);

    const rows = screen.getAllByRole("row");
    expect(rows[rows.length - 1]).toHaveTextContent("BENCH");
  });

  it("has no editable inputs or add/remove controls — it's read-only", () => {
    render(<RosterConstructionTable rosterConstruction={{ QB: 1 }} />);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
