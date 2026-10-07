import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardLeagueCard } from "@/components/dashboard/DashboardLeagueCard";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { SyncLeagueForm } from "@/components/dashboard/SyncLeagueForm";

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
              <DashboardLeagueCard
                leagueId={league.id}
                name={league.name}
                platform={league.platform}
                mode={league.mode}
              />
            </li>
          ))}
        </ul>
      )}
      <SyncLeagueForm />
      <Link
        href="/leagues/new"
        className="mx-auto text-sm text-secondary-accent hover:underline"
      >
        + Create a Custom League
      </Link>
    </div>
  );
}
