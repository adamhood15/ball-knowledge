"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SleeperProvider } from "@/lib/providers/league/sleeper/SleeperProvider";
import { syncSleeperLeague } from "@/lib/leagueSync/syncSleeperLeague";
import { refreshSleeperPlayerCrosswalkIfStale } from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import { createUpstashPlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";

export interface SyncLeagueActionState {
  error: string | null;
}

export async function syncSleeperLeagueAction(
  _previousState: SyncLeagueActionState,
  formData: FormData,
): Promise<SyncLeagueActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const externalLeagueId = String(formData.get("sleeperLeagueId") ?? "").trim();
  if (!externalLeagueId) {
    return { error: "Enter a Sleeper league ID." };
  }

  let leagueId: string;
  try {
    const result = await syncSleeperLeague({
      leagueProvider: new SleeperProvider(),
      prisma,
      externalLeagueId,
      syncingUserId: session.user.id,
    });
    leagueId = result.leagueId;
  } catch {
    return { error: "Couldn't sync that league. Double-check the Sleeper league ID and try again." };
  }

  // The full Sleeper player list refresh (thousands of upserts) must not block the redirect —
  // it runs after the response is sent, gated by its own daily-staleness check either way.
  after(() =>
    refreshSleeperPlayerCrosswalkIfStale({
      clock: createUpstashPlayerCrosswalkClock(),
      prisma,
    }),
  );

  redirect(`/leagues/${leagueId}`);
}
