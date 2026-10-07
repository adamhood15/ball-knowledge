import type { InjuryRiskLevel, ProjectedStatLine } from "@/lib/projections/ProjectionsProvider";
import { computeLeagueAdjustedPoints } from "@/lib/valuation/computeLeagueAdjustedPoints";
import { computeUsableGamesRemaining, TOTAL_REGULAR_SEASON_GAMES } from "@/lib/valuation/computeUsableGamesRemaining";
import { injuryRiskMultiplier } from "@/lib/valuation/injuryRiskMultiplier";

// Stage 3 (Phase 3, roadmap.md section 5): given a player and a league, returns a single
// league-adjusted, risk-adjusted rest-of-season projected value — composing Stage 2's scoring
// adjustment with the games-remaining and injury-discount pieces of Stage 3.
export function getPlayerProjectedValue({
  statLine,
  scoringSettings,
  position,
  currentWeek,
  byeWeek,
  injuryRisk,
}: {
  statLine: ProjectedStatLine;
  scoringSettings: Record<string, number>;
  position: string;
  currentWeek: number;
  byeWeek: number | null;
  injuryRisk: InjuryRiskLevel;
}): number {
  const fullSeasonPoints = computeLeagueAdjustedPoints(statLine, scoringSettings, position);
  const pointsPerGame = fullSeasonPoints / TOTAL_REGULAR_SEASON_GAMES;
  const usableGamesRemaining = computeUsableGamesRemaining({ currentWeek, byeWeek });

  return pointsPerGame * usableGamesRemaining * injuryRiskMultiplier(injuryRisk);
}
