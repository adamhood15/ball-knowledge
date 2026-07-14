import { prisma } from "@/lib/prisma";
import { TeamStrip } from "@/components/leagues/TeamStrip";

export default async function LeagueTeamsPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  const teams = await prisma.team.findMany({ where: { leagueId }, orderBy: { externalTeamId: "asc" } });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto font-display text-xl text-body-text">League</h1>
      <p className="mx-auto text-sm text-muted-text">Click a team to view their roster.</p>
      <TeamStrip
        leagueId={leagueId}
        teams={teams.map((team) => ({
          teamId: team.id,
          teamName: team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`,
          avatarUrl: team.platformAvatarUrl,
        }))}
      />
    </div>
  );
}
