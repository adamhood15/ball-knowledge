import type { ProjectedStatLine } from "@/lib/projections/ProjectionsProvider";

// Not a real platform stat category — a synthetic key (see customLeagueSettings.ts) that adds
// bonus points per reception for TE-position players specifically, layered on top of `rec`.
const TE_BONUS_REC_KEY = "te_bonus_rec";

export function computeLeagueAdjustedPoints(
  statLine: ProjectedStatLine,
  scoringSettings: Record<string, number>,
  position: string,
): number {
  let points = 0;
  for (const [statKey, statValue] of Object.entries(statLine)) {
    points += statValue * (scoringSettings[statKey] ?? 0);
  }

  if (position === "TE") {
    points += statLine.rec * (scoringSettings[TE_BONUS_REC_KEY] ?? 0);
  }

  return points;
}
