import type { InjuryRiskLevel } from "@/lib/projections/ProjectionsProvider";

// FantasyPros' projections endpoint doesn't expose a real statistical variance/range. This is a
// deliberate, documented heuristic stand-in (not real variance) so the field exists for the risk
// stage to consume — base band per position (skill positions with more committee/TD-dependent
// weekly swings get a wider band), bumped up when the player is carrying injury risk.
const BASE_VARIANCE_BY_POSITION: Record<string, number> = {
  QB: 0.15,
  RB: 0.3,
  WR: 0.25,
  TE: 0.3,
  K: 0.2,
};
const DEFAULT_BASE_VARIANCE = 0.25;

const INJURY_RISK_VARIANCE_BUMP: Record<InjuryRiskLevel, number> = {
  HEALTHY: 0,
  QUESTIONABLE: 0.1,
  OUT: 0.2,
};

export function deriveHeuristicVariance({
  position,
  injuryRisk,
}: {
  position: string;
  injuryRisk: InjuryRiskLevel;
}): number {
  // A defense is a team unit, not an individual — injury risk (and the variance band built
  // around it) doesn't apply the way it does to a player.
  if (position === "DEF") return 0;

  const baseVariance = BASE_VARIANCE_BY_POSITION[position] ?? DEFAULT_BASE_VARIANCE;
  const variance = baseVariance + INJURY_RISK_VARIANCE_BUMP[injuryRisk];
  return Math.min(1, Math.max(0, variance));
}
