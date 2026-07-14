export interface LeagueProviderLeagueInfo {
  externalLeagueId: string;
  name: string;
  season: string;
  /** Raw starting-lineup slot list as the platform reports it, e.g. ["QB","RB","RB","FLEX","BN","BN"]. */
  rosterPositionSlots: string[];
  /** Stat category -> point value, in the platform's own stat category naming. */
  scoringSettings: Record<string, number>;
}

export interface LeagueProviderRosterPlayer {
  canonicalPlayerId: string;
  isStarter: boolean;
}

export interface LeagueProviderRoster {
  externalTeamId: string;
  ownerExternalUserId: string | null;
  players: LeagueProviderRosterPlayer[];
}

export interface LeagueProviderMember {
  externalUserId: string;
  displayName: string;
  teamName: string | null;
  avatarUrl: string | null;
}

export interface LeagueProvider {
  getLeagueInfo(externalLeagueId: string): Promise<LeagueProviderLeagueInfo>;
  getRosters(externalLeagueId: string): Promise<LeagueProviderRoster[]>;
  getScoringSettings(externalLeagueId: string): Promise<Record<string, number>>;
  getLeagueMembers(externalLeagueId: string): Promise<LeagueProviderMember[]>;
}
