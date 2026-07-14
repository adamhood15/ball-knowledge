"use client";

import { useTransition } from "react";
import { TeamCard } from "@/components/leagues/TeamCard";

export interface SelectableTeam {
  teamId: string;
  teamName: string;
  avatarUrl: string | null;
}

export function SelectTeamGrid({
  leagueId,
  teams,
  claimTeamAction,
}: {
  leagueId: string;
  teams: SelectableTeam[];
  claimTeamAction: (leagueId: string, teamId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {teams.map((team) => (
        <button
          key={team.teamId}
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => claimTeamAction(leagueId, team.teamId))}
          className="disabled:opacity-60"
        >
          <TeamCard teamName={team.teamName} avatarUrl={team.avatarUrl} variant="grid" />
        </button>
      ))}
    </div>
  );
}
