import { describe, expect, it } from "vitest";
import { FANTASY_RELEVANT_POSITIONS, isFantasyRelevantPosition } from "@/lib/leagueSettings/fantasyPositions";

describe("FANTASY_RELEVANT_POSITIONS", () => {
  it("includes exactly the standard fantasy positions", () => {
    expect(FANTASY_RELEVANT_POSITIONS).toEqual(["QB", "RB", "WR", "TE", "K", "DEF"]);
  });
});

describe("isFantasyRelevantPosition", () => {
  it("accepts standard fantasy positions", () => {
    for (const position of ["QB", "RB", "WR", "TE", "K", "DEF"]) {
      expect(isFantasyRelevantPosition(position)).toBe(true);
    }
  });

  it("rejects offensive line and other non-fantasy positions", () => {
    for (const position of ["G", "T", "C", "OL", "OT", "OG", "LS", "LB", "CB", "DB", "S", "FS", "SS", "DE", "DT", "NT", "P"]) {
      expect(isFantasyRelevantPosition(position)).toBe(false);
    }
  });

  it("rejects null", () => {
    expect(isFantasyRelevantPosition(null)).toBe(false);
  });
});
