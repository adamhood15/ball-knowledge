export type ScoringStatCategory = "passing" | "rushing" | "receiving" | "defense" | "specialTeams" | "other";

/** QB stats first, then RB, then WR, then defense, then special teams/kicking. */
export const SCORING_STAT_CATEGORY_ORDER: ScoringStatCategory[] = [
  "passing",
  "rushing",
  "receiving",
  "defense",
  "specialTeams",
  "other",
];

interface ScoringStatMeta {
  label: string;
  category: ScoringStatCategory;
}

const SCORING_STAT_META: Record<string, ScoringStatMeta> = {
  pass_yd: { label: "Passing Yard", category: "passing" },
  pass_td: { label: "Passing Touchdown", category: "passing" },
  pass_int: { label: "Interception Thrown", category: "passing" },
  pass_2pt: { label: "Passing 2-Point Conversion", category: "passing" },

  rush_yd: { label: "Rushing Yard", category: "rushing" },
  rush_td: { label: "Rushing Touchdown", category: "rushing" },
  rush_2pt: { label: "Rushing 2-Point Conversion", category: "rushing" },
  fum: { label: "Fumble", category: "rushing" },
  fum_lost: { label: "Fumble Lost", category: "rushing" },

  rec: { label: "Reception", category: "receiving" },
  rec_yd: { label: "Receiving Yard", category: "receiving" },
  rec_td: { label: "Receiving Touchdown", category: "receiving" },
  rec_2pt: { label: "Receiving 2-Point Conversion", category: "receiving" },

  int: { label: "Interception", category: "defense" },
  sack: { label: "Sack", category: "defense" },
  ff: { label: "Forced Fumble", category: "defense" },
  fum_rec: { label: "Fumble Recovery", category: "defense" },
  fum_rec_td: { label: "Fumble Recovery Touchdown", category: "defense" },
  safe: { label: "Safety", category: "defense" },
  def_td: { label: "Defensive Touchdown", category: "defense" },
  def_st_td: { label: "Defensive/Special Teams Touchdown", category: "defense" },
  def_st_ff: { label: "Defensive/Special Teams Forced Fumble", category: "defense" },
  def_st_fum_rec: { label: "Defensive/Special Teams Fumble Recovery", category: "defense" },
  pts_allow_0: { label: "Points Allowed: 0", category: "defense" },
  pts_allow_1_6: { label: "Points Allowed: 1-6", category: "defense" },
  pts_allow_7_13: { label: "Points Allowed: 7-13", category: "defense" },
  pts_allow_14_20: { label: "Points Allowed: 14-20", category: "defense" },
  pts_allow_21_27: { label: "Points Allowed: 21-27", category: "defense" },
  pts_allow_28_34: { label: "Points Allowed: 28-34", category: "defense" },
  pts_allow_35p: { label: "Points Allowed: 35+", category: "defense" },

  st_td: { label: "Special Teams Touchdown", category: "specialTeams" },
  st_ff: { label: "Special Teams Forced Fumble", category: "specialTeams" },
  st_fum_rec: { label: "Special Teams Fumble Recovery", category: "specialTeams" },
  blk_kick: { label: "Block Kick", category: "specialTeams" },
  fgm_0_19: { label: "Field Goal Made 0-19 Yards", category: "specialTeams" },
  fgm_20_29: { label: "Field Goal Made 20-29 Yards", category: "specialTeams" },
  fgm_30_39: { label: "Field Goal Made 30-39 Yards", category: "specialTeams" },
  fgm_40_49: { label: "Field Goal Made 40-49 Yards", category: "specialTeams" },
  fgm_50p: { label: "Field Goal Made 50+ Yards", category: "specialTeams" },
  fgmiss: { label: "Field Goal Missed", category: "specialTeams" },
  xpm: { label: "Extra Point Made", category: "specialTeams" },
  xpmiss: { label: "Extra Point Missed", category: "specialTeams" },
};

export function scoringStatLabel(statKey: string): string {
  return SCORING_STAT_META[statKey]?.label ?? statKey;
}

export function scoringStatCategory(statKey: string): ScoringStatCategory {
  return SCORING_STAT_META[statKey]?.category ?? "other";
}

export interface LabeledScoringStat {
  statKey: string;
  label: string;
  points: number;
}

export interface ScoringStatCategoryGroup {
  category: ScoringStatCategory;
  stats: LabeledScoringStat[];
}

export function groupAndLabelScoringSettings(
  scoringSettings: Record<string, number>,
): ScoringStatCategoryGroup[] {
  const statsByCategory = new Map<ScoringStatCategory, LabeledScoringStat[]>();

  for (const [statKey, points] of Object.entries(scoringSettings)) {
    const category = scoringStatCategory(statKey);
    const label = scoringStatLabel(statKey);
    const stats = statsByCategory.get(category) ?? [];
    stats.push({ statKey, label, points });
    statsByCategory.set(category, stats);
  }

  return SCORING_STAT_CATEGORY_ORDER.filter((category) => statsByCategory.has(category)).map((category) => ({
    category,
    stats: statsByCategory.get(category)!.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}
