"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LeagueModeBadge } from "@/components/leagues/LeagueModeBadge";
import type { LeagueMode } from "@/lib/providers/league/LeagueProvider";

export interface TradeSetupLeague {
  id: string;
  name: string;
  mode: LeagueMode;
}

export function TradeSetupStep({
  leagues,
  onSelectLeague,
  onUseCustomSettings,
}: {
  leagues: TradeSetupLeague[];
  onSelectLeague: (leagueId: string) => void;
  onUseCustomSettings: () => void;
}) {
  if (leagues.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-text">
          Sync a league for roster-aware trade evaluation, or run a quick valuation with your own
          scoring settings — no league required.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center rounded-none border-2 border-muted-text/30 px-4 py-2 text-sm text-body-text shadow-[2px_2px_0_0_var(--color-neutral-shadow)] transition-all duration-150 hover:border-card-border hover:shadow-[2px_2px_0_0_var(--color-card-border)]"
        >
          Sync a League
        </Link>
        <Button onClick={onUseCustomSettings} className="w-fit">
          Quick Custom Valuation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-text">Which league is this trade for?</p>
      {leagues.map((league) => (
        <button
          key={league.id}
          type="button"
          onClick={() => onSelectLeague(league.id)}
          className="flex items-center justify-between gap-3 rounded-none border-2 border-muted-text/30 bg-background px-4 py-3 text-left text-body-text shadow-[2px_2px_0_0_var(--color-neutral-shadow)] transition-all duration-150 hover:border-card-border hover:shadow-[2px_2px_0_0_var(--color-card-border)]"
        >
          <span>{league.name}</span>
          <LeagueModeBadge mode={league.mode} />
        </button>
      ))}
      <Button variant="secondary" onClick={onUseCustomSettings} className="w-fit">
        Use Custom Settings Instead
      </Button>
    </div>
  );
}
