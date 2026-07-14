import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeamRosterView } from "@/lib/leagueSync/getTeamRosterView";
import { createUpstashPlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import { TeamStrip } from "@/components/leagues/TeamStrip";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";

export default async function LeagueTeamDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;

  const teams = await prisma.team.findMany({ where: { leagueId }, orderBy: { externalTeamId: "asc" } });
  if (!teams.some((team) => team.id === teamId)) {
    notFound();
  }

  const rosterView = await getTeamRosterView({
    prisma,
    teamId,
    clock: createUpstashPlayerCrosswalkClock(),
  });
  if (!rosterView) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto font-display text-xl text-body-text">League</h1>
      <TeamStrip
        leagueId={leagueId}
        selectedTeamId={teamId}
        teams={teams.map((team) => ({
          teamId: team.id,
          teamName: team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`,
          avatarUrl: team.platformAvatarUrl,
        }))}
      />
      <div className="mx-auto w-full max-w-md">
        <TeamRosterCard teamName={rosterView.teamName} players={rosterView.players} />
      </div>
    </div>
  );
}
