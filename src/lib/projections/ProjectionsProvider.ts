export type InjuryRiskLevel = "HEALTHY" | "QUESTIONABLE" | "OUT";

// Canonical, provider-agnostic stat categories using the same Sleeper-anchored stat keys the
// rest of the app already stores scoring settings under (see scoringStatLabels.ts) — so the
// valuation engine's scoring stage can score a projection against a league's scoringSettings
// without any provider-specific key translation.
export interface ProjectedStatLine {
  pass_yd: number;
  pass_td: number;
  pass_int: number;
  rush_yd: number;
  rush_td: number;
  fum_lost: number;
  rec: number;
  rec_yd: number;
  rec_td: number;
}

export interface PlayerSeasonProjection {
  externalPlayerId: string;
  name: string;
  /** Canonical position naming (QB/RB/WR/TE/K/DEF), not the provider's own position code. */
  position: string;
  nflTeam: string | null;
  season: string;
  /** Full projected regular-season stat totals (see TOTAL_REGULAR_SEASON_GAMES in the risk stage). */
  statLine: ProjectedStatLine;
  injuryRisk: InjuryRiskLevel;
  /** Heuristic uncertainty band in [0, 1] — not real statistical variance. The provider's
   * projections endpoint doesn't expose one; see deriveHeuristicVariance for how this is built. */
  variance: number;
}

export interface ProjectionsProvider {
  getSeasonProjections(season: string): Promise<PlayerSeasonProjection[]>;
}
