"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function claimTeamAction(leagueId: string, teamId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  if (league.createdByUserId !== session.user.id) {
    throw new Error("Only this league's commissioner can claim a team in it.");
  }

  await prisma.$transaction([
    prisma.team.updateMany({
      where: { leagueId, ownerId: session.user.id },
      data: { ownerId: null },
    }),
    prisma.team.update({
      where: { id: teamId },
      data: { ownerId: session.user.id },
    }),
  ]);

  revalidatePath(`/leagues/${leagueId}`);
}
