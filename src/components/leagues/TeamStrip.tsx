import Link from "next/link";
import { TeamCard } from "@/components/leagues/TeamCard";

export interface TeamStripItem {
  teamId: string;
  teamName: string;
  avatarUrl: string | null;
}

export function TeamStrip({
  leagueId,
  teams,
  selectedTeamId,
}: {
  leagueId: string;
  teams: TeamStripItem[];
  selectedTeamId?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap gap-3">
      {teams.map((team) => (
        <Link key={team.teamId} href={`/leagues/${leagueId}/teams/${team.teamId}`}>
          <TeamCard
            teamName={team.teamName}
            avatarUrl={team.avatarUrl}
            variant="row"
            isSelected={team.teamId === selectedTeamId}
          />
        </Link>
      ))}
    </div>
  );
}
