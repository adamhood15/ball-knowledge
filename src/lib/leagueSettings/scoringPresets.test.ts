import { describe, expect, it } from "vitest";
import { applyScoringPreset, SCORING_PRESET_RECEPTION_POINTS } from "@/lib/leagueSettings/scoringPresets";

describe("applyScoringPreset", () => {
  it("sets the reception point value for PPR, Half-PPR, and Standard presets explicitly", () => {
    const baseSettings = { rec: 0, rec_yd: 0.1, pass_td: 4 };

    expect(applyScoringPreset(baseSettings, "PPR").rec).toBe(1);
    expect(applyScoringPreset(baseSettings, "HALF_PPR").rec).toBe(0.5);
    expect(applyScoringPreset(baseSettings, "STANDARD").rec).toBe(0);
  });

  it("preserves every other stat category untouched", () => {
    const baseSettings = { rec: 0.5, rec_yd: 0.1, pass_td: 4 };

    const updated = applyScoringPreset(baseSettings, "PPR");

    expect(updated.rec_yd).toBe(0.1);
    expect(updated.pass_td).toBe(4);
  });

  it("adds a rec key when the settings don't already have one", () => {
    const baseSettings = { pass_td: 4 };

    expect(applyScoringPreset(baseSettings, "PPR").rec).toBe(SCORING_PRESET_RECEPTION_POINTS.PPR);
  });
});
