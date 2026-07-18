import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeamRosterView } from "@/lib/leagueSync/getTeamRosterView";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";
import { TeamCard } from "@/components/leagues/TeamCard";
import { SelectTeamGrid } from "@/components/leagues/SelectTeamGrid";
import { claimTeamAction } from "@/app/leagues/[leagueId]/actions";

export default async function MyTeamPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  // Auth already enforced by the layout for this route segment.
  const session = await auth();
  const currentUserId = session!.user!.id!;

  const teams = await prisma.team.findMany({
    where: { leagueId },
    orderBy: { externalTeamId: "asc" },
  });

  const myTeam = teams.find((team) => team.ownerId === currentUserId);

  if (!myTeam) {
    return (
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="mx-auto font-display text-xl text-body-text">Select Your Team</h1>
        <SelectTeamGrid
          leagueId={leagueId}
          teams={teams.map((team) => ({
            teamId: team.id,
            teamName: team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`,
            avatarUrl: team.platformAvatarUrl,
          }))}
          claimTeamAction={claimTeamAction}
        />
      </div>
    );
  }

  const rosterView = await getTeamRosterView({ prisma, teamId: myTeam.id });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <TeamCard teamName={rosterView!.teamName} avatarUrl={rosterView!.avatarUrl} variant="row" isSelected />
      </div>
      <div className="mx-auto w-full max-w-md">
        <TeamRosterCard players={rosterView!.players} />
      </div>
    </div>
  );
}
