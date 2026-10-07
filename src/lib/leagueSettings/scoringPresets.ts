export type ScoringPreset = "STANDARD" | "HALF_PPR" | "PPR";

export const SCORING_PRESET_RECEPTION_POINTS: Record<ScoringPreset, number> = {
  STANDARD: 0,
  HALF_PPR: 0.5,
  PPR: 1,
};

export function applyScoringPreset(
  scoringSettings: Record<string, number>,
  preset: ScoringPreset,
): Record<string, number> {
  return { ...scoringSettings, rec: SCORING_PRESET_RECEPTION_POINTS[preset] };
}
