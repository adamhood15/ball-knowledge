import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { claimLeagueInviteAction } from "@/app/invites/actions";
import { Button } from "@/components/ui/Button";

export default async function ClaimInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.leagueInvite.findUnique({
    where: { token },
    include: { league: true, team: true },
  });

  if (!invite || invite.status !== "PENDING") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="font-display text-xl text-body-text">Invite not available</h1>
        <p className="text-sm text-muted-text">
          This invite link is no longer valid — it may have already been claimed.
        </p>
      </div>
    );
  }

  const session = await auth();
  const teamName = invite.team.platformTeamName ?? invite.team.platformDisplayName ?? "your team";

  if (!session?.user?.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="font-display text-xl text-body-text">You&rsquo;re invited to {invite.league.name}</h1>
        <p className="text-sm text-muted-text">Sign in, then come back to this same link to claim {teamName}.</p>
        <Link href="/sign-in">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-display text-xl text-body-text">You&rsquo;re invited to {invite.league.name}</h1>
      <p className="text-sm text-muted-text">Claim {teamName} as your own?</p>
      <form action={claimLeagueInviteAction.bind(null, token)}>
        <Button type="submit">Claim {teamName}</Button>
      </form>
    </div>
  );
}
