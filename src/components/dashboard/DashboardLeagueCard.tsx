"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteLeagueAction } from "@/app/leagues/[leagueId]/actions";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { LeagueModeBadge } from "@/components/leagues/LeagueModeBadge";
import { LeaguePlatformIcon } from "@/components/leagues/LeaguePlatformIcon";
import { IconButton } from "@/components/ui/IconButton";
import type { LeagueMode } from "@/lib/providers/league/LeagueProvider";

export function DashboardLeagueCard({
  leagueId,
  name,
  platform,
  mode,
}: {
  leagueId: string;
  name: string;
  platform: string;
  mode: LeagueMode;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Remove ${name} from your leagues? This can't be undone.`)) return;
    startTransition(() => deleteLeagueAction(leagueId));
  }

  return (
    <div className="relative">
      <Link
        href={`/leagues/${leagueId}`}
        className="flex items-center gap-3 rounded-none border-2 border-muted-text/30 bg-background p-4 pr-12 text-body-text shadow-[2px_2px_0_0_var(--color-neutral-shadow)] transition-all duration-150 hover:border-card-border hover:shadow-[3px_3px_0_0_var(--color-card-border)]"
      >
        <LeaguePlatformIcon platform={platform} className="h-5 w-5 flex-shrink-0 text-secondary-accent" />
        <span className="truncate">{name}</span>
        <LeagueModeBadge mode={mode} />
      </Link>
      <IconButton
        aria-label={`Remove ${name}`}
        disabled={isPending}
        onClick={handleDelete}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}
