import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";
import { TeamRosterCard, type TeamRosterPlayer } from "@/components/leagues/TeamRosterCard";

interface RosterSnapshotPlayer {
  canonicalPlayerId: string;
  isStarter: boolean;
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { teams: { orderBy: { externalTeamId: "asc" } } },
  });

  if (!league || league.createdByUserId !== session.user.id) {
    notFound();
  }

  const teamIds = league.teams.map((team) => team.id);
  const latestRosterByTeam = await prisma.roster.findMany({
    where: { teamId: { in: teamIds } },
    orderBy: { snapshotAt: "desc" },
    distinct: ["teamId"],
  });
  const rosterByTeamId = new Map(latestRosterByTeam.map((roster) => [roster.teamId, roster]));

  const canonicalPlayerIds = new Set<string>();
  for (const roster of latestRosterByTeam) {
    for (const rosterPlayer of roster.players as unknown as RosterSnapshotPlayer[]) {
      canonicalPlayerIds.add(rosterPlayer.canonicalPlayerId);
    }
  }
  const players = await prisma.player.findMany({
    where: { canonicalId: { in: [...canonicalPlayerIds] } },
  });
  const playerByCanonicalId = new Map(players.map((player) => [player.canonicalId, player]));

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        <h1 className="font-display text-2xl text-body-text">{league.name}</h1>
        <p className="text-sm text-muted-text">Scoring settings</p>
        <ScoringSettingsTable scoringSettings={(league.scoringSettings as Record<string, number>) ?? {}} />
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        {league.teams.map((team) => {
          const roster = rosterByTeamId.get(team.id);
          const rosterPlayers = (roster?.players as unknown as RosterSnapshotPlayer[] | undefined) ?? [];
          const teamRosterPlayers: TeamRosterPlayer[] = rosterPlayers.map((rosterPlayer) => {
            const player = playerByCanonicalId.get(rosterPlayer.canonicalPlayerId);
            return {
              canonicalPlayerId: rosterPlayer.canonicalPlayerId,
              name: player?.name ?? null,
              position: player?.position ?? null,
              isStarter: rosterPlayer.isStarter,
            };
          });

          return (
            <TeamRosterCard
              key={team.id}
              teamName={team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`}
              players={teamRosterPlayers}
            />
          );
        })}
      </div>
    </div>
  );
}
