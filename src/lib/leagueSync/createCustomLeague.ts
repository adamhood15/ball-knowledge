import type { LeagueMode, Prisma, PrismaClient } from "@/generated/prisma/client";

function placeholderTeamName(teamNumber: number): string {
  return `Team ${teamNumber}`;
}

export interface CustomLeagueRosterPlayer {
  canonicalPlayerId: string;
  rosterSlot: string | null;
}

export async function createCustomLeague({
  prisma,
  creatingUserId,
  name,
  mode,
  teamCount,
  scoringSettings,
  rosterConstruction,
  myTeamName,
  myTeamRoster,
}: {
  prisma: Pick<PrismaClient, "league" | "team" | "roster">;
  creatingUserId: string;
  name: string;
  mode: LeagueMode;
  teamCount: number;
  scoringSettings: Record<string, number>;
  rosterConstruction: Record<string, number>;
  myTeamName?: string;
  myTeamRoster?: CustomLeagueRosterPlayer[];
}): Promise<{ leagueId: string; myTeamId: string }> {
  const league = await prisma.league.create({
    data: {
      platform: "MANUAL",
      name,
      mode,
      scoringSettings,
      rosterConstruction,
      createdByUserId: creatingUserId,
    },
  });

  let myTeamId = "";
  for (let teamNumber = 1; teamNumber <= teamCount; teamNumber++) {
    const isCreatorsTeam = teamNumber === 1;
    const team = await prisma.team.create({
      data: {
        leagueId: league.id,
        externalTeamId: String(teamNumber),
        ownerId: isCreatorsTeam ? creatingUserId : null,
        platformTeamName: isCreatorsTeam ? (myTeamName ?? placeholderTeamName(teamNumber)) : placeholderTeamName(teamNumber),
      },
    });
    if (isCreatorsTeam) myTeamId = team.id;
  }

  if (myTeamRoster && myTeamRoster.length > 0) {
    await prisma.roster.create({
      data: { teamId: myTeamId, players: myTeamRoster as unknown as Prisma.InputJsonValue },
    });
  }

  return { leagueId: league.id, myTeamId };
}
