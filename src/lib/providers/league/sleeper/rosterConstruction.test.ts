import { describe, expect, it } from "vitest";
import leagueFixture from "./__fixtures__/league.json";
import { rosterPositionSlotsToRosterConstruction } from "@/lib/providers/league/sleeper/rosterConstruction";

describe("rosterPositionSlotsToRosterConstruction", () => {
  it("tallies a standard single-QB roster's slot list, renaming BN to BENCH", () => {
    const rosterConstruction = rosterPositionSlotsToRosterConstruction([
      "QB",
      "RB",
      "RB",
      "WR",
      "WR",
      "TE",
      "FLEX",
      "K",
      "DEF",
      "BN",
      "BN",
      "BN",
    ]);

    expect(rosterConstruction).toEqual({
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      K: 1,
      DEF: 1,
      BENCH: 3,
    });
  });

  it("counts multiple FLEX slots for a double-flex league", () => {
    const rosterConstruction = rosterPositionSlotsToRosterConstruction([
      "QB",
      "RB",
      "RB",
      "WR",
      "WR",
      "TE",
      "FLEX",
      "FLEX",
      "FLEX",
      "K",
      "DEF",
      "BN",
      "BN",
    ]);

    expect(rosterConstruction.FLEX).toBe(3);
  });

  it("counts multiple QB slots for a two-QB/superflex league", () => {
    const rosterConstruction = rosterPositionSlotsToRosterConstruction([
      "QB",
      "QB",
      "RB",
      "RB",
      "WR",
      "WR",
      "TE",
      "SUPER_FLEX",
      "BN",
      "BN",
    ]);

    expect(rosterConstruction.QB).toBe(2);
    expect(rosterConstruction.SUPER_FLEX).toBe(1);
  });

  it("matches the real synced league's fixture roster positions", () => {
    const rosterConstruction = rosterPositionSlotsToRosterConstruction(leagueFixture.roster_positions);

    expect(rosterConstruction).toEqual({
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 2,
      K: 1,
      DEF: 1,
      BENCH: 10,
    });
  });
});
