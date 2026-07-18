import { prisma } from "@/lib/prisma";
import { ScoringSettingsTable } from "@/components/leagues/ScoringSettingsTable";
import { RosterConstructionTable } from "@/components/leagues/RosterConstructionTable";

export default async function LeagueSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  // Auth + commissioner-ownership already enforced by the layout for this route segment.
  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });

  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-display text-2xl text-body-text">League settings</h1>
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="mb-4 font-display text-lg text-body-text">Roster construction</h2>
        <RosterConstructionTable rosterConstruction={(league.rosterConstruction as Record<string, number>) ?? {}} />
      </div>
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="mb-4 font-display text-lg text-body-text">Scoring settings</h2>
        <ScoringSettingsTable scoringSettings={(league.scoringSettings as Record<string, number>) ?? {}} />
      </div>
    </div>
  );
}
