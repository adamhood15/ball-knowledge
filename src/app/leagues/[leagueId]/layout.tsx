import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  if (!league || league.createdByUserId !== session.user.id) {
    notFound();
  }

  const navLinkClassName = "text-sm text-body-text hover:text-secondary-accent";

  return (
    <div className="flex flex-1 flex-col">
      <nav className="mx-auto flex w-full max-w-4xl gap-6 border-b border-card-border/20 px-4 py-3">
        <Link href={`/leagues/${leagueId}`} className={navLinkClassName}>
          My Team
        </Link>
        <Link href={`/leagues/${leagueId}/teams`} className={navLinkClassName}>
          League
        </Link>
        <Link href={`/leagues/${leagueId}/scoring`} className={navLinkClassName}>
          Scoring Settings
        </Link>
        <span className="text-sm text-muted-text/50" title="Coming soon">
          Trade
        </span>
      </nav>
      {children}
    </div>
  );
}
