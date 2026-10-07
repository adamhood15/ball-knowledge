"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logInviteLinkToConsole } from "@/lib/dev-mail";

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

export async function updateScoringSettingsAction(
  leagueId: string,
  scoringSettings: Record<string, number>,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  if (league.createdByUserId !== session.user.id) {
    throw new Error("Only this league's commissioner can update its scoring settings.");
  }

  await prisma.league.update({ where: { id: leagueId }, data: { scoringSettings } });

  revalidatePath(`/leagues/${leagueId}/settings`);
}

export async function updateRosterConstructionAction(
  leagueId: string,
  rosterConstruction: Record<string, number>,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  if (league.createdByUserId !== session.user.id) {
    throw new Error("Only this league's commissioner can update its roster construction.");
  }

  await prisma.league.update({ where: { id: leagueId }, data: { rosterConstruction } });

  revalidatePath(`/leagues/${leagueId}/settings`);
}

export async function deleteLeagueAction(leagueId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  if (league.createdByUserId !== session.user.id) {
    throw new Error("Only this league's commissioner can delete it.");
  }

  await prisma.league.delete({ where: { id: leagueId } });

  revalidatePath("/dashboard");
}

export async function sendLeagueInviteAction(
  leagueId: string,
  teamId: string,
  invitedEmail: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
  if (league.createdByUserId !== session.user.id) {
    throw new Error("Only this league's commissioner can invite someone to claim a team in it.");
  }

  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  if (team.leagueId !== leagueId) {
    throw new Error("That team doesn't belong to this league.");
  }
  if (team.ownerId) {
    throw new Error("That team has already been claimed.");
  }

  const token = randomBytes(24).toString("hex");
  await prisma.leagueInvite.create({
    data: { leagueId, teamId, invitedEmail, token },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  logInviteLinkToConsole({ invitedEmail, url: `${baseUrl}/invites/${token}` });

  revalidatePath(`/leagues/${leagueId}/teams`);
}
