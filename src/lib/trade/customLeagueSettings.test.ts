import { describe, expect, it } from "vitest";
import {
  DEFAULT_CUSTOM_LEAGUE_SETTINGS,
  defaultRosterConstructionForCustomLeague,
  defaultScoringSettingsForCustomLeague,
  type CustomLeagueSettings,
} from "@/lib/trade/customLeagueSettings";

describe("defaultScoringSettingsForCustomLeague", () => {
  it("sets the reception value per the PPR/Half-PPR/Standard preset", () => {
    const ppr = defaultScoringSettingsForCustomLeague({ ...DEFAULT_CUSTOM_LEAGUE_SETTINGS, scoring: "PPR" });
    const halfPpr = defaultScoringSettingsForCustomLeague({ ...DEFAULT_CUSTOM_LEAGUE_SETTINGS, scoring: "HALF_PPR" });
    const standard = defaultScoringSettingsForCustomLeague({ ...DEFAULT_CUSTOM_LEAGUE_SETTINGS, scoring: "STANDARD" });

    expect(ppr.rec).toBe(1);
    expect(halfPpr.rec).toBe(0.5);
    expect(standard.rec).toBe(0);
  });

  it("includes a full standard set of stat categories beyond just reception", () => {
    const settings = defaultScoringSettingsForCustomLeague(DEFAULT_CUSTOM_LEAGUE_SETTINGS);

    expect(settings.pass_td).toBe(4);
    expect(settings.rush_td).toBe(6);
    expect(settings.rec_td).toBe(6);
    expect(settings.pass_int).toBeLessThan(0);
  });

  it("adds a TE reception bonus on top of the base reception value when TE premium is on", () => {
    const withoutPremium = defaultScoringSettingsForCustomLeague({
      ...DEFAULT_CUSTOM_LEAGUE_SETTINGS,
      tePremium: "OFF",
    });
    const withPremium = defaultScoringSettingsForCustomLeague({
      ...DEFAULT_CUSTOM_LEAGUE_SETTINGS,
      tePremium: "ON",
    });

    expect(withoutPremium.te_bonus_rec).toBeUndefined();
    expect(withPremium.te_bonus_rec).toBeGreaterThan(0);
  });
});

describe("defaultRosterConstructionForCustomLeague", () => {
  it("returns a standard 1QB roster construction when qbFormat is ONE_QB", () => {
    const rosterConstruction = defaultRosterConstructionForCustomLeague({
      ...DEFAULT_CUSTOM_LEAGUE_SETTINGS,
      qbFormat: "ONE_QB",
    });

    expect(rosterConstruction).toEqual({
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      DEF: 1,
      K: 1,
      BENCH: 5,
    });
  });

  it("adds a SUPERFLEX slot alongside the standard QB slot when qbFormat is SUPERFLEX", () => {
    const rosterConstruction = defaultRosterConstructionForCustomLeague({
      ...DEFAULT_CUSTOM_LEAGUE_SETTINGS,
      qbFormat: "SUPERFLEX",
    });

    expect(rosterConstruction.QB).toBe(1);
    expect(rosterConstruction.SUPERFLEX).toBe(1);
  });

  it("satisfies type-checking against the CustomLeagueSettings shape", () => {
    const settings: CustomLeagueSettings = DEFAULT_CUSTOM_LEAGUE_SETTINGS;
    expect(defaultRosterConstructionForCustomLeague(settings)).toBeDefined();
  });
});
