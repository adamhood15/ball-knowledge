import type {
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
    };
  }

  async getRosters(externalLeagueId: string): Promise<LeagueProviderRoster[]> {
    const rosters = await this.fetchJson<SleeperRosterResponse[]>(`/league/${externalLeagueId}/rosters`);
    return rosters.map((roster) => {
      const starterPlayerIds = new Set((roster.starters ?? []).filter((playerId) => playerId !== "0"));
      return {
        externalTeamId: String(roster.roster_id),
        ownerExternalUserId: roster.owner_id,
        players: (roster.players ?? []).map((canonicalPlayerId) => ({
          canonicalPlayerId,
          isStarter: starterPlayerIds.has(canonicalPlayerId),
        })),
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
