export type LeagueTypeSetting = "REDRAFT" | "DYNASTY";
export type QbFormatSetting = "ONE_QB" | "SUPERFLEX";
export type TePremiumSetting = "OFF" | "ON";
export type ScoringPresetSetting = "STANDARD" | "HALF_PPR" | "PPR";

export interface CustomLeagueSettings {
  leagueType: LeagueTypeSetting;
  qbFormat: QbFormatSetting;
  tePremium: TePremiumSetting;
  scoring: ScoringPresetSetting;
}

export const DEFAULT_CUSTOM_LEAGUE_SETTINGS: CustomLeagueSettings = {
  leagueType: "REDRAFT",
  qbFormat: "ONE_QB",
  tePremium: "OFF",
  scoring: "PPR",
};

const SCORING_PRESET_RECEPTION_POINTS: Record<ScoringPresetSetting, number> = {
  STANDARD: 0,
  HALF_PPR: 0.5,
  PPR: 1,
};

// A standard, commonly-used point value per stat category, independent of the
// reception-value preset (which overrides `rec` below) and TE premium (which adds
// `te_bonus_rec` on top). Uses the same stat keys as scoringStatLabels.ts.
const BASE_SCORING_SETTINGS: Record<string, number> = {
  pass_yd: 0.04,
  pass_td: 4,
  pass_int: -2,
  pass_2pt: 2,
  rush_yd: 0.1,
  rush_td: 6,
  rush_2pt: 2,
  fum_lost: -2,
  rec_yd: 0.1,
  rec_td: 6,
  rec_2pt: 2,
  int: 2,
  sack: 1,
  ff: 1,
  fum_rec: 2,
  safe: 2,
  def_td: 6,
  blk_kick: 2,
  fgm_0_19: 3,
  fgm_20_29: 3,
  fgm_30_39: 3,
  fgm_40_49: 4,
  fgm_50p: 5,
  fgmiss: -1,
  xpm: 1,
  xpmiss: -1,
};

// Bonus points per reception for TE-position players specifically, layered on top of
// `rec`. Not a real Sleeper/ESPN stat code — the valuation engine (Phase 3+) is the
// intended consumer and must special-case this key by checking a player's position.
const TE_PREMIUM_BONUS_REC_POINTS = 0.5;

export function defaultScoringSettingsForCustomLeague(
  settings: CustomLeagueSettings,
): Record<string, number> {
  return {
    ...BASE_SCORING_SETTINGS,
    rec: SCORING_PRESET_RECEPTION_POINTS[settings.scoring],
    ...(settings.tePremium === "ON" ? { te_bonus_rec: TE_PREMIUM_BONUS_REC_POINTS } : {}),
  };
}

// A standard 1QB/2RB/2WR/1TE/1FLEX/1DEF/1K/5BENCH layout. Superflex leagues keep the
// dedicated QB slot and add a separate SUPERFLEX slot (QB-eligible in addition to it),
// matching how real superflex leagues are configured rather than replacing the QB slot.
const STANDARD_ROSTER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "DEF", "K", "BENCH", "BENCH", "BENCH", "BENCH", "BENCH"];
const SUPERFLEX_ROSTER_SLOTS = [...STANDARD_ROSTER_SLOTS, "SUPERFLEX"];

function tallySlots(slots: string[]): Record<string, number> {
  const slotCounts: Record<string, number> = {};
  for (const slot of slots) {
    slotCounts[slot] = (slotCounts[slot] ?? 0) + 1;
  }
  return slotCounts;
}

export function defaultRosterConstructionForCustomLeague(
  settings: CustomLeagueSettings,
): Record<string, number> {
  return tallySlots(settings.qbFormat === "SUPERFLEX" ? SUPERFLEX_ROSTER_SLOTS : STANDARD_ROSTER_SLOTS);
}
