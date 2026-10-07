"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCustomLeague } from "@/lib/leagueSync/createCustomLeague";
import type { CreateCustomLeagueInput } from "@/components/leagues/CreateCustomLeagueWizard";

export async function createCustomLeagueAction(input: CreateCustomLeagueInput): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  const result = await createCustomLeague({
    prisma,
    creatingUserId: session.user.id,
    ...input,
  });

  redirect(`/leagues/${result.leagueId}`);
}
