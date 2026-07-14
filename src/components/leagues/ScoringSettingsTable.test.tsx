import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";

describe("ScoringSettingsTable", () => {
  it("renders each stat category with its point value, sorted alphabetically", () => {
    render(<ScoringSettingsTable scoringSettings={{ rec: 0.5, pass_td: 4, rush_yd: 0.1 }} />);

    const rows = screen.getAllByRole("row").slice(1); // skip header row
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("pass_td"),
      expect.stringContaining("rec"),
      expect.stringContaining("rush_yd"),
    ]);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });
});
