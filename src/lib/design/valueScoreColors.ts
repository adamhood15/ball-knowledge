export interface ValueScoreColorClasses {
  background: string;
  text: string;
  border: string;
}

const HIGH_SCORE_THRESHOLD = 70;
const MEDIUM_SCORE_THRESHOLD = 40;

const HIGH: ValueScoreColorClasses = {
  background: "bg-green-500/15",
  text: "text-green-400",
  border: "border-green-500/40",
};

const MEDIUM: ValueScoreColorClasses = {
  background: "bg-yellow-500/15",
  text: "text-yellow-400",
  border: "border-yellow-500/40",
};

const LOW: ValueScoreColorClasses = {
  background: "bg-red-500/15",
  text: "text-red-400",
  border: "border-red-500/40",
};

export function getValueScoreColorClasses(score: number): ValueScoreColorClasses {
  if (score >= HIGH_SCORE_THRESHOLD) return HIGH;
  if (score >= MEDIUM_SCORE_THRESHOLD) return MEDIUM;
  return LOW;
}
