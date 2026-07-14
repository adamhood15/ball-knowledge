import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";

export default async function LeagueScoringSettingsPage({
  params,
}: {
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

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <Link href={`/leagues/${league.id}`} className="text-sm text-secondary-accent hover:underline">
          ← Back to {league.name}
        </Link>
        <h1 className="font-display text-2xl text-body-text">Scoring settings</h1>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <ScoringSettingsTable scoringSettings={(league.scoringSettings as Record<string, number>) ?? {}} />
      </div>
    </div>
  );
}
