import { prisma } from "@/lib/prisma";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";

export default async function LeagueScoringSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  // Auth + commissioner-ownership already enforced by the layout for this route segment.
  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto w-full max-w-2xl font-display text-2xl text-body-text">Scoring settings</h1>
      <div className="mx-auto w-full max-w-2xl">
        <ScoringSettingsTable scoringSettings={(league.scoringSettings as Record<string, number>) ?? {}} />
      </div>
    </div>
  );
}
