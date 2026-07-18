import type {
  LeagueMode,
  LeagueProvider,
  LeagueProviderLeagueInfo,
  LeagueProviderMember,
  LeagueProviderRoster,
} from "@/lib/providers/league/LeagueProvider";

const SLEEPER_API_BASE_URL = "https://api.sleeper.app/v1";

interface SleeperLeagueResponse {
  league_id: string;
  name: string;
  season: string;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  settings: { type: number };
}

// Sleeper's settings.type: 0 = redraft, 1 = keeper, 2 = dynasty. Keeper leagues collapse into
// REDRAFT since the app's LeagueMode is binary and a keeper league is much closer to redraft
// (partial, limited retention) than to full dynasty (entire rosters carry over every year).
function sleeperLeagueTypeToLeagueMode(sleeperLeagueType: number): LeagueMode {
  return sleeperLeagueType === 2 ? "DYNASTY" : "REDRAFT";
}

interface SleeperRosterResponse {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters: string[] | null;
}

interface SleeperUserResponse {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata: { team_name?: string } | null;
}

type FetchImpl = (url: string) => Promise<Response>;

export class SleeperProvider implements LeagueProvider {
  constructor(private readonly fetchImpl: FetchImpl = fetch) {}

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${SLEEPER_API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Sleeper API request failed: ${path} returned status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getLeagueInfo(externalLeagueId: string): Promise<LeagueProviderLeagueInfo> {
    const league = await this.fetchJson<SleeperLeagueResponse>(`/league/${externalLeagueId}`);
    return {
      externalLeagueId: league.league_id,
      name: league.name,
      season: league.season,
      rosterPositionSlots: league.roster_positions,
      scoringSettings: league.scoring_settings,
      leagueMode: sleeperLeagueTypeToLeagueMode(league.settings.type),
    };
  }

  async getRosters(
    externalLeagueId: string,
    rosterPositionSlots: string[],
  ): Promise<LeagueProviderRoster[]> {
    const rosters = await this.fetchJson<SleeperRosterResponse[]>(`/league/${externalLeagueId}/rosters`);
    // Sleeper's per-roster `starters` array is positionally parallel to the league's non-bench
    // roster_positions prefix: starters[i] fills the slot named at startingSlotLabels[i]. An
    // unfilled slot is represented as the literal string "0".
    const startingSlotLabels = rosterPositionSlots.filter((slot) => slot !== "BN");

    return rosters.map((roster) => {
      const startingSlotByPlayerId = new Map<string, string>();
      (roster.starters ?? []).forEach((playerId, slotIndex) => {
        if (playerId !== "0") startingSlotByPlayerId.set(playerId, startingSlotLabels[slotIndex] ?? "FLEX");
      });

      const startingPlayerIdsInSlotOrder = (roster.starters ?? []).filter((playerId) => playerId !== "0");
      const benchPlayerIds = (roster.players ?? []).filter((playerId) => !startingSlotByPlayerId.has(playerId));

      return {
        externalTeamId: String(roster.roster_id),
        ownerExternalUserId: roster.owner_id,
        players: [
          ...startingPlayerIdsInSlotOrder.map((canonicalPlayerId) => ({
            canonicalPlayerId,
            rosterSlot: startingSlotByPlayerId.get(canonicalPlayerId)!,
          })),
          ...benchPlayerIds.map((canonicalPlayerId) => ({ canonicalPlayerId, rosterSlot: null })),
        ],
      };
    });
  }

  async getScoringSettings(externalLeagueId: string): Promise<Record<string, number>> {
    const league = await this.fetchJson<SleeperLeagueResponse>(`/league/${externalLeagueId}`);
    return league.scoring_settings;
  }

  async getLeagueMembers(externalLeagueId: string): Promise<LeagueProviderMember[]> {
    const users = await this.fetchJson<SleeperUserResponse[]>(`/league/${externalLeagueId}/users`);
    return users.map((user) => ({
      externalUserId: user.user_id,
      displayName: user.display_name,
      teamName: user.metadata?.team_name ?? null,
      avatarUrl: user.avatar ? `https://sleepercdn.com/avatars/${user.avatar}` : null,
    }));
  }
}
