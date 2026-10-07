import { describe, expect, it } from "vitest";
import { computeLeagueAdjustedPoints } from "@/lib/valuation/computeLeagueAdjustedPoints";
import type { ProjectedStatLine } from "@/lib/projections/ProjectionsProvider";

const BASE_SCORING_SETTINGS: Record<string, number> = {
  pass_yd: 0.04,
  pass_td: 4,
  pass_int: -2,
  rush_yd: 0.1,
  rush_td: 6,
  fum_lost: -2,
  rec_yd: 0.1,
  rec_td: 6,
};

const wrStatLine: ProjectedStatLine = {
  pass_yd: 0,
  pass_td: 0,
  pass_int: 0,
  rush_yd: 0,
  rush_td: 0,
  fum_lost: 1,
  rec: 100,
  rec_yd: 1200,
  rec_td: 8,
};

describe("computeLeagueAdjustedPoints", () => {
  it("scores a QB's passing and rushing stat line against a league's point values", () => {
    const qbStatLine: ProjectedStatLine = {
      pass_yd: 4000,
      pass_td: 28,
      pass_int: 10,
      rush_yd: 400,
      rush_td: 4,
      fum_lost: 3,
      rec: 0,
      rec_yd: 0,
      rec_td: 0,
    };

    const points = computeLeagueAdjustedPoints(qbStatLine, BASE_SCORING_SETTINGS, "QB");

    // 4000*0.04 + 28*4 + 10*-2 + 400*0.1 + 4*6 + 3*-2 = 160 + 112 - 20 + 40 + 24 - 6 = 310
    expect(points).toBeCloseTo(310, 5);
  });

  it("scores standard (non-PPR) with rec at 0 — receptions don't add points beyond yardage/TDs", () => {
    const points = computeLeagueAdjustedPoints(wrStatLine, { ...BASE_SCORING_SETTINGS, rec: 0 }, "WR");

    // 1200*0.1 + 8*6 + 1*-2 + 100*0 = 120 + 48 - 2 + 0 = 166
    expect(points).toBeCloseTo(166, 5);
  });

  it("scores half-PPR with rec at 0.5 — half a point per reception on top of standard scoring", () => {
    const points = computeLeagueAdjustedPoints(wrStatLine, { ...BASE_SCORING_SETTINGS, rec: 0.5 }, "WR");

    // Standard 166 + 100 receptions * 0.5 = 216
    expect(points).toBeCloseTo(216, 5);
  });

  it("scores full PPR with rec at 1 — a full point per reception on top of standard scoring", () => {
    const points = computeLeagueAdjustedPoints(wrStatLine, { ...BASE_SCORING_SETTINGS, rec: 1 }, "WR");

    // Standard 166 + 100 receptions * 1 = 266
    expect(points).toBeCloseTo(266, 5);
  });

  it("applies a TE premium bonus-per-reception only for a TE, on top of the league's normal reception value", () => {
    const teScoringSettings = { ...BASE_SCORING_SETTINGS, rec: 1, te_bonus_rec: 0.5 };

    const tePoints = computeLeagueAdjustedPoints(wrStatLine, teScoringSettings, "TE");
    const wrPoints = computeLeagueAdjustedPoints(wrStatLine, teScoringSettings, "WR");

    // TE gets the extra 0.5/rec bonus (100 receptions * 0.5 = 50 more) that a WR with an
    // identical stat line under the same league settings does not.
    expect(tePoints).toBeCloseTo(wrPoints + 50, 5);
  });

  it("ignores a te_bonus_rec setting entirely for a non-TE position", () => {
    const points = computeLeagueAdjustedPoints(wrStatLine, { ...BASE_SCORING_SETTINGS, rec: 1, te_bonus_rec: 0.5 }, "RB");

    // Same as the full-PPR case above (266) — no TE bonus applied.
    expect(points).toBeCloseTo(266, 5);
  });

  it("treats a missing stat category in scoringSettings as worth zero points, not an error", () => {
    const minimalSettings = { rec_yd: 0.1 };

    const points = computeLeagueAdjustedPoints(wrStatLine, minimalSettings, "WR");

    expect(points).toBeCloseTo(120, 5);
  });
});
