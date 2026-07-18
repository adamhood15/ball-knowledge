import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeamRosterView } from "@/lib/leagueSync/getTeamRosterView";
import { TeamRosterCard } from "@/components/leagues/TeamRosterCard";
import { TeamCard } from "@/components/leagues/TeamCard";

export default async function LeagueTeamDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;

  const session = await auth();
  const currentUserId = session!.user!.id!;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.leagueId !== leagueId) {
    notFound();
  }

  const rosterView = await getTeamRosterView({ prisma, teamId });
  if (!rosterView) {
    notFound();
  }

  const isOwnTeam = team.ownerId === currentUserId;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
        <TeamCard teamName={rosterView.teamName} avatarUrl={rosterView.avatarUrl} variant="row" />
        {!isOwnTeam ? (
          <Link
            href={`/leagues/${leagueId}/trade/${teamId}`}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-card-border/60 px-4 py-2 text-sm text-body-text hover:border-card-border"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M6 3a1 1 0 0 1 1 1v1h7a1 1 0 1 1 0 2H7v1a1 1 0 0 1-1.7.7L3 6.4a1 1 0 0 1 0-1.4L5.3 2.7A1 1 0 0 1 6 3Zm8 13a1 1 0 0 1-1-1v-1H6a1 1 0 1 1 0-2h7v-1a1 1 0 0 1 1.7-.7l2.3 2.3a1 1 0 0 1 0 1.4l-2.3 2.3a1 1 0 0 1-.7.7Z" />
            </svg>
            Trade
          </Link>
        ) : null}
      </div>
      <div className="mx-auto w-full max-w-md">
        <TeamRosterCard players={rosterView.players} />
      </div>
    </div>
  );
}
