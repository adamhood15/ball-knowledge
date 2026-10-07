import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LeagueStandingsList } from "@/components/leagues/LeagueStandingsList";
import { sendLeagueInviteAction } from "@/app/leagues/[leagueId]/actions";

export default async function LeagueTeamsPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;

  // Auth already enforced by the layout for this route segment.
  const session = await auth();
  const currentUserId = session!.user!.id!;

  const [league, teams, pendingInvites] = await Promise.all([
    prisma.league.findUniqueOrThrow({ where: { id: leagueId } }),
    prisma.team.findMany({ where: { leagueId }, orderBy: { externalTeamId: "asc" } }),
    prisma.leagueInvite.findMany({ where: { leagueId, status: "PENDING" } }),
  ]);

  const canManageInvites = league.createdByUserId === currentUserId;
  const pendingInviteEmailByTeamId = new Map(pendingInvites.map((invite) => [invite.teamId, invite.invitedEmail]));

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto font-display text-xl text-body-text">League</h1>
      <p className="mx-auto text-sm text-muted-text">Click a team to view their roster.</p>
      <LeagueStandingsList
        leagueId={leagueId}
        canManageInvites={canManageInvites}
        sendInviteAction={canManageInvites ? sendLeagueInviteAction.bind(null, leagueId) : undefined}
        teams={teams.map((team) => ({
          teamId: team.id,
          teamName: team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`,
          avatarUrl: team.platformAvatarUrl,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          pointsFor: team.pointsFor,
          pointsAgainst: team.pointsAgainst,
          waiverPosition: team.waiverPosition,
          isClaimed: Boolean(team.ownerId),
          pendingInviteEmail: pendingInviteEmailByTeamId.get(team.id) ?? null,
        }))}
      />
    </div>
  );
}
