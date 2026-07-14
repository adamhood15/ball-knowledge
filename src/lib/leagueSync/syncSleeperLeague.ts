import type { PrismaClient } from "@/generated/prisma/client";
import type { LeagueProvider } from "@/lib/providers/league/LeagueProvider";
import { rosterPositionSlotsToRosterConstruction } from "@/lib/providers/league/sleeper/rosterConstruction";

export async function syncSleeperLeague({
  leagueProvider,
  prisma,
  externalLeagueId,
  syncingUserId,
}: {
  leagueProvider: LeagueProvider;
  prisma: PrismaClient;
  externalLeagueId: string;
  syncingUserId: string;
}): Promise<{ leagueId: string }> {
  const leagueInfo = await leagueProvider.getLeagueInfo(externalLeagueId);
  const [rosters, members] = await Promise.all([
    leagueProvider.getRosters(externalLeagueId, leagueInfo.rosterPositionSlots),
    leagueProvider.getLeagueMembers(externalLeagueId),
  ]);

  const rosterConstruction = rosterPositionSlotsToRosterConstruction(leagueInfo.rosterPositionSlots);
  const memberByExternalUserId = new Map(members.map((member) => [member.externalUserId, member]));

  const league = await prisma.league.upsert({
    where: { platform_externalLeagueId: { platform: "SLEEPER", externalLeagueId } },
    create: {
      platform: "SLEEPER",
      externalLeagueId,
      name: leagueInfo.name,
      scoringSettings: leagueInfo.scoringSettings,
      rosterConstruction,
      createdByUserId: syncingUserId,
    },
    update: {
      name: leagueInfo.name,
      scoringSettings: leagueInfo.scoringSettings,
      rosterConstruction,
    },
  });

  for (const roster of rosters) {
    const member = roster.ownerExternalUserId ? memberByExternalUserId.get(roster.ownerExternalUserId) : undefined;

    const team = await prisma.team.upsert({
      where: { leagueId_externalTeamId: { leagueId: league.id, externalTeamId: roster.externalTeamId } },
      create: {
        leagueId: league.id,
        externalTeamId: roster.externalTeamId,
        platformDisplayName: member?.displayName ?? null,
        platformTeamName: member?.teamName ?? null,
        platformAvatarUrl: member?.avatarUrl ?? null,
      },
      update: {
        platformDisplayName: member?.displayName ?? null,
        platformTeamName: member?.teamName ?? null,
        platformAvatarUrl: member?.avatarUrl ?? null,
      },
    });

    await prisma.roster.create({
      data: {
        teamId: team.id,
        players: roster.players.map((rosterPlayer) => ({
          canonicalPlayerId: rosterPlayer.canonicalPlayerId,
          rosterSlot: rosterPlayer.rosterSlot,
        })),
      },
    });
  }

  return { leagueId: league.id };
}
