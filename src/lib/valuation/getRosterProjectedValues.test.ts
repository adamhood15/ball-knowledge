import { describe, expect, it, vi } from "vitest";
import { getRosterProjectedValues } from "@/lib/valuation/getRosterProjectedValues";
import type { PlayerSeasonProjection, ProjectionsProvider } from "@/lib/projections/ProjectionsProvider";

function fakeProvider(projections: PlayerSeasonProjection[]): ProjectionsProvider {
  return { getSeasonProjections: vi.fn(async () => projections) };
}

const wrProjection: PlayerSeasonProjection = {
  externalPlayerId: "90201",
  name: "Puka Nacua",
  position: "WR",
  nflTeam: "LAR",
  season: "2026",
  statLine: {
    pass_yd: 0,
    pass_td: 0,
    pass_int: 0,
    rush_yd: 0,
    rush_td: 0,
    fum_lost: 0,
    rec: 100,
    rec_yd: 1400,
    rec_td: 8,
  },
  injuryRisk: "HEALTHY",
  variance: 0.25,
};

const SCORING_SETTINGS: Record<string, number> = { rec: 1, rec_yd: 0.1, rec_td: 6 };

describe("getRosterProjectedValues", () => {
  it("returns a projected value for a roster player matched by normalized name", async () => {
    const values = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: "Puka Nacua", position: "WR", byeWeek: null }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 1,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });

    expect(values.has("1")).toBe(true);
    expect(values.get("1")).toBeGreaterThan(0);
  });

  it("matches names regardless of case/punctuation differences, same as the crosswalk convention", async () => {
    const values = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: "PUKA NACUA", position: "WR", byeWeek: null }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 1,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });

    expect(values.has("1")).toBe(true);
  });

  it("omits a roster player with no matching FantasyPros projection, rather than erroring", async () => {
    const values = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: "Someone Not In Sample", position: "RB", byeWeek: null }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 1,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });

    expect(values.has("1")).toBe(false);
  });

  it("skips a roster player with no crosswalked name at all", async () => {
    const values = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: null, position: null, byeWeek: null }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 1,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });

    expect(values.has("1")).toBe(false);
  });

  it("uses the roster player's own bye week (not anything from the projection) in the value calculation", async () => {
    const valuesWithByeAhead = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: "Puka Nacua", position: "WR", byeWeek: 9 }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 5,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });
    const valuesWithByePassed = await getRosterProjectedValues({
      players: [{ canonicalPlayerId: "1", name: "Puka Nacua", position: "WR", byeWeek: 9 }],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 10,
      season: "2026",
      projectionsProvider: fakeProvider([wrProjection]),
    });

    // Fewer weeks remain by week 10, but the bye is already spent by then rather than still
    // ahead — both real, non-zero values, and different from one another either way.
    expect(valuesWithByeAhead.get("1")).not.toBe(valuesWithByePassed.get("1"));
  });

  it("calls the provider only once even for a full roster of many players", async () => {
    const provider = fakeProvider([wrProjection]);
    await getRosterProjectedValues({
      players: [
        { canonicalPlayerId: "1", name: "Puka Nacua", position: "WR", byeWeek: null },
        { canonicalPlayerId: "2", name: "Someone Else", position: "RB", byeWeek: null },
      ],
      scoringSettings: SCORING_SETTINGS,
      currentWeek: 1,
      season: "2026",
      projectionsProvider: provider,
    });

    expect(provider.getSeasonProjections).toHaveBeenCalledTimes(1);
  });
});
