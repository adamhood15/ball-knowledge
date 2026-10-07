"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SleeperProvider } from "@/lib/providers/league/sleeper/SleeperProvider";
import { syncSleeperLeague } from "@/lib/leagueSync/syncSleeperLeague";
import { refreshSleeperPlayerCrosswalkIfStale } from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import { createUpstashPlayerCrosswalkClock } from "@/lib/providers/league/sleeper/playerCrosswalkClock";
import {
  getCurrentNflSeason,
  getSleeperUserLeagues,
  resolveSleeperUsername,
} from "@/lib/providers/league/sleeper/sleeperUserLookup";

export interface LookupSleeperLeaguesState {
  error: string | null;
  result: {
    sleeperUserId: string;
    sleeperUsername: string;
    leagues: { externalLeagueId: string; name: string }[];
  } | null;
}

export async function lookupSleeperLeaguesAction(
  _previousState: LookupSleeperLeaguesState,
  formData: FormData,
): Promise<LookupSleeperLeaguesState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return { error: null, result: null };
  }

  const username = String(formData.get("username") ?? "").trim();
  if (!username) {
    return { error: "Enter your Sleeper username.", result: null };
  }

  try {
    const resolvedUser = await resolveSleeperUsername({ username });
    if (!resolvedUser) {
      return { error: "Couldn't find that Sleeper username. Double-check the spelling and try again.", result: null };
    }

    const season = await getCurrentNflSeason();
    const leagues = await getSleeperUserLeagues({ externalUserId: resolvedUser.externalUserId, season });

    return {
      error: null,
      result: {
        sleeperUserId: resolvedUser.externalUserId,
        sleeperUsername: resolvedUser.displayName,
        leagues,
      },
    };
  } catch {
    return { error: "Couldn't look up Sleeper leagues right now. Try again in a moment.", result: null };
  }
}

export async function syncSelectedSleeperLeaguesAction(
  sleeperUserId: string,
  externalLeagueIds: string[],
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
    return;
  }

  for (const externalLeagueId of externalLeagueIds) {
    await syncSleeperLeague({
      leagueProvider: new SleeperProvider(),
      prisma,
      externalLeagueId,
      syncingUserId: session.user.id,
      autoClaimExternalUserId: sleeperUserId,
    });
  }

  // The full Sleeper player list refresh (thousands of upserts) must not block the redirect —
  // it runs after the response is sent, gated by its own daily-staleness check either way.
  after(() =>
    refreshSleeperPlayerCrosswalkIfStale({
      clock: createUpstashPlayerCrosswalkClock(),
      prisma,
    }),
  );

  redirect("/dashboard");
}
