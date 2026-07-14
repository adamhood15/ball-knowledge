import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeamRosterView } from "@/lib/leagueSync/getTeamRosterView";
import { createUpstashPlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import { TradeBuilder } from "@/components/trade/TradeBuilder";

export default async function TradeBuilderPage({
  params,
}: {
  params: Promise<{ leagueId: string; opponentTeamId: string }>;
}) {
  const { leagueId, opponentTeamId } = await params;

  const session = await auth();
  const currentUserId = session!.user!.id!;

  const myTeamRow = await prisma.team.findFirst({ where: { leagueId, ownerId: currentUserId } });
  const opponentTeamRow = await prisma.team.findUnique({ where: { id: opponentTeamId } });
  if (!myTeamRow || !opponentTeamRow || opponentTeamRow.leagueId !== leagueId || opponentTeamRow.id === myTeamRow.id) {
    notFound();
  }

  const clock = createUpstashPlayerCrosswalkClock();
  const [myRosterView, opponentRosterView] = await Promise.all([
    getTeamRosterView({ prisma, teamId: myTeamRow.id, clock }),
    getTeamRosterView({ prisma, teamId: opponentTeamRow.id, clock }),
  ]);
  if (!myRosterView || !opponentRosterView) {
    notFound();
  }

  return (
    <TradeBuilder
      myTeam={{ teamName: myRosterView.teamName, players: myRosterView.players }}
      opponentTeam={{ teamName: opponentRosterView.teamName, players: opponentRosterView.players }}
    />
  );
}
