"use client";

import { useTransition } from "react";

export function ClaimTeamButton({
  leagueId,
  teamId,
  claimTeamAction,
}: {
  leagueId: string;
  teamId: string;
  claimTeamAction: (leagueId: string, teamId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => claimTeamAction(leagueId, teamId))}
      className="text-xs text-secondary-accent hover:underline disabled:opacity-60"
    >
      {isPending ? "Claiming…" : "This is my team"}
    </button>
  );
}
