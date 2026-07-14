import Link from "next/link";
import { TeamCard } from "@/components/leagues/TeamCard";

export interface TeamStripItem {
  teamId: string;
  teamName: string;
  avatarUrl: string | null;
}

export function TeamStrip({ leagueId, teams }: { leagueId: string; teams: TeamStripItem[] }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      {teams.map((team) => (
        <Link key={team.teamId} href={`/leagues/${leagueId}/teams/${team.teamId}`} className="block w-full">
          <TeamCard teamName={team.teamName} avatarUrl={team.avatarUrl} variant="row" />
        </Link>
      ))}
    </div>
  );
}
