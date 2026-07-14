import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";

describe("ScoringSettingsTable", () => {
  it("renders each stat category grouped under a readable heading, in QB/RB/WR/DEF/ST order, with human-readable labels", () => {
    render(
      <ScoringSettingsTable
        scoringSettings={{ rec: 0.5, pass_td: 4, rush_yd: 0.1, blk_kick: 2, int: 2 }}
      />,
    );

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual(["Passing", "Rushing", "Receiving", "Defense", "Special Teams"]);

    expect(screen.getByText("Block Kick")).toBeInTheDocument();
    expect(screen.queryByText("blk_kick")).not.toBeInTheDocument();
    expect(screen.getByText("Passing Touchdown")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("omits category headings that have no stats configured", () => {
    render(<ScoringSettingsTable scoringSettings={{ rec: 1 }} />);

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual(["Receiving"]);
  });

  it("rounds point values to the nearest hundredth, fixing floating-point artifacts from the raw API", () => {
    render(<ScoringSettingsTable scoringSettings={{ pass_yd: 0.03999999910593033, rush_yd: 0.1 }} />);

    expect(screen.getByText("0.04")).toBeInTheDocument();
    expect(screen.getByText("0.1")).toBeInTheDocument();
    expect(screen.queryByText("0.03999999910593033")).not.toBeInTheDocument();
  });
});
