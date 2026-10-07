"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function claimLeagueInviteAction(token: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const invite = await prisma.leagueInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING") {
    throw new Error("This invite is no longer valid.");
  }

  const userId = session.user.id;

  await prisma.$transaction([
    prisma.team.updateMany({
      where: { leagueId: invite.leagueId, ownerId: userId },
      data: { ownerId: null },
    }),
    prisma.team.update({
      where: { id: invite.teamId },
      data: { ownerId: userId },
    }),
    prisma.leagueInvite.update({
      where: { id: invite.id },
      data: { status: "CLAIMED", respondedAt: new Date() },
    }),
  ]);

  revalidatePath(`/leagues/${invite.leagueId}`);
  redirect(`/leagues/${invite.leagueId}`);
}
