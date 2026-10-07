import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LeagueModeBadge } from "@/components/leagues/LeagueModeBadge";
import { MyTeamIcon } from "@/components/icons/MyTeamIcon";
import { LeagueIcon } from "@/components/icons/LeagueIcon";
import { SettingsIcon } from "@/components/icons/SettingsIcon";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) {
    notFound();
  }

  const isCommissioner = league.createdByUserId === session.user.id;
  const ownsATeamInLeague = isCommissioner
    ? true
    : Boolean(await prisma.team.findFirst({ where: { leagueId, ownerId: session.user.id } }));
  if (!isCommissioner && !ownsATeamInLeague) {
    notFound();
  }

  const navLinkClassName = "flex items-center gap-2 whitespace-nowrap text-sm text-body-text hover:text-secondary-accent";

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 pt-6">
        <h1 className="font-display text-base text-body-text">{league.name}</h1>
        <LeagueModeBadge mode={league.mode} />
      </header>
      <nav className="mx-auto flex w-full max-w-4xl gap-6 overflow-x-auto border-b border-card-border/20 px-4 py-3">
        <Link href={`/leagues/${leagueId}`} className={navLinkClassName}>
          <MyTeamIcon className="h-5 w-5" />
          Team
        </Link>
        <Link href={`/leagues/${leagueId}/teams`} className={navLinkClassName}>
          <LeagueIcon className="h-5 w-5" />
          League
        </Link>
        <Link href={`/leagues/${leagueId}/settings`} className={navLinkClassName}>
          <SettingsIcon className="h-5 w-5" />
          Scoring
        </Link>
      </nav>
      {children}
    </div>
  );
}
