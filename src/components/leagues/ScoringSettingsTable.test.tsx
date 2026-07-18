import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";

describe("ScoringSettingsTable", () => {
  it("groups stats by category with human-readable labels, in category order", () => {
    render(<ScoringSettingsTable scoringSettings={{ rec: 0.5, pass_td: 4, sack: 1 }} />);

    const headings = screen.getAllByRole("heading").map((h) => h.textContent);
    expect(headings).toEqual(["Passing", "Receiving", "Defense"]);
    expect(screen.getByText("Reception")).toBeInTheDocument();
    expect(screen.getByText("Passing Touchdown")).toBeInTheDocument();
  });

  it("rounds point values to the nearest hundredth to hide floating-point noise", () => {
    render(<ScoringSettingsTable scoringSettings={{ pass_yd: 0.03999999910593033 }} />);

    expect(screen.getByText("0.04")).toBeInTheDocument();
  });

  it("has no editable inputs — it's read-only", () => {
    render(<ScoringSettingsTable scoringSettings={{ rec: 1 }} />);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
