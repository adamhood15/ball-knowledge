import type { PrismaClient } from "@/generated/prisma/client";
import { ensurePlayersResolvable } from "@/lib/providers/league/sleeper/refreshPlayerCrosswalk";
import type { TeamRosterPlayer } from "@/components/leagues/TeamRosterCard";

interface RosterSnapshotPlayer {
  canonicalPlayerId: string;
  rosterSlot: string | null;
}

export interface TeamRosterView {
  teamName: string;
  avatarUrl: string | null;
  players: TeamRosterPlayer[];
}

/**
 * Fetches a team's latest roster snapshot with player names resolved, guaranteeing no
 * "Unknown player" entries by forcing a targeted crosswalk refresh for anything missing.
 */
export async function getTeamRosterView({
  prisma,
  teamId,
  fetchImpl,
}: {
  prisma: Pick<PrismaClient, "team" | "roster" | "player">;
  teamId: string;
  fetchImpl?: (url: string) => Promise<Response>;
}): Promise<TeamRosterView | null> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return null;

  const roster = await prisma.roster.findFirst({ where: { teamId }, orderBy: { snapshotAt: "desc" } });
  const rosterPlayers = (roster?.players as unknown as RosterSnapshotPlayer[] | undefined) ?? [];
  const canonicalPlayerIds = rosterPlayers.map((rosterPlayer) => rosterPlayer.canonicalPlayerId);

  await ensurePlayersResolvable({ prisma, canonicalPlayerIds, fetchImpl });

  const players = await prisma.player.findMany({ where: { canonicalId: { in: canonicalPlayerIds } } });
  const playerByCanonicalId = new Map(players.map((player) => [player.canonicalId, player]));

  return {
    teamName: team.platformTeamName ?? team.platformDisplayName ?? `Team ${team.externalTeamId}`,
    avatarUrl: team.platformAvatarUrl,
    players: rosterPlayers.map((rosterPlayer) => {
      const player = playerByCanonicalId.get(rosterPlayer.canonicalPlayerId);
      return {
        canonicalPlayerId: rosterPlayer.canonicalPlayerId,
        name: player?.name ?? null,
        position: player?.position ?? null,
        nflTeam: player?.nflTeam ?? null,
        rosterSlot: rosterPlayer.rosterSlot,
      };
    }),
  };
}
