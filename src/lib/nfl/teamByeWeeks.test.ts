import { describe, expect, it } from "vitest";
import { getTeamByeWeek } from "@/lib/nfl/teamByeWeeks";

describe("getTeamByeWeek", () => {
  it("returns the correct 2026 bye week for a known team", () => {
    expect(getTeamByeWeek("KC")).toBe(5);
    expect(getTeamByeWeek("BUF")).toBe(7);
    expect(getTeamByeWeek("DAL")).toBe(14);
  });

  it("covers all 32 NFL teams with no duplicates", () => {
    const teams = [
      "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
      "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
      "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG",
      "NYJ", "PHI", "PIT", "SF", "SEA", "TB", "TEN", "WAS",
    ];

    for (const team of teams) {
      expect(getTeamByeWeek(team)).not.toBeNull();
    }
    expect(new Set(teams).size).toBe(32);
  });

  it("returns null for an unrecognized team code", () => {
    expect(getTeamByeWeek("XYZ")).toBeNull();
  });

  it("returns null for a null team", () => {
    expect(getTeamByeWeek(null)).toBeNull();
  });
});
