import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { SyncLeagueForm } from "@/components/dashboard/SyncLeagueForm";
import { LeagueModeBadge } from "@/components/leagues/LeagueModeBadge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const leaguesOwnedByUser = await prisma.league.findMany({
    where: { createdByUserId: session.user.id },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h2 className="text-center font-display text-2xl text-body-text">Your Leagues</h2>
      {leaguesOwnedByUser.length === 0 ? (
        <EmptyDashboardState />
      ) : (
        <ul className="mx-auto flex w-full max-w-lg flex-col gap-3">
          {leaguesOwnedByUser.map((league) => (
            <li key={league.id}>
              <Link
                href={`/leagues/${league.id}`}
                className="flex items-center gap-3 rounded-lg border border-card-border/30 bg-background p-4 text-body-text hover:border-card-border/60"
              >
                <span>{league.name}</span>
                <LeagueModeBadge mode={league.mode} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SyncLeagueForm />
    </div>
  );
}
