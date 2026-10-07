import type { InjuryRiskLevel } from "@/lib/projections/ProjectionsProvider";

// A discount applied to a player's rest-of-season projected value based on their *current*
// injury designation — not a season-long average risk (that nuance lives in heuristicVariance).
const INJURY_RISK_MULTIPLIER: Record<InjuryRiskLevel, number> = {
  HEALTHY: 1,
  QUESTIONABLE: 0.9,
  OUT: 0.65,
};

export function injuryRiskMultiplier(injuryRisk: InjuryRiskLevel): number {
  return INJURY_RISK_MULTIPLIER[injuryRisk];
}
