import type { LeagueMode } from "@/lib/providers/league/LeagueProvider";

const MODE_LABELS: Record<LeagueMode, string> = {
  REDRAFT: "Redraft",
  DYNASTY: "Dynasty",
};

export function LeagueModeBadge({ mode }: { mode: LeagueMode }) {
  return (
    <span
      data-testid="league-mode-badge"
      className="rounded border border-card-border/40 px-2 py-0.5 font-accent text-sm tracking-wide text-secondary-accent"
    >
      {MODE_LABELS[mode]}
    </span>
  );
}
