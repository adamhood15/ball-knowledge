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
  /** The specific starting slot this player fills (e.g. "QB", "RB", "FLEX"), or null if benched. */
  rosterSlot: string | null;
}

export interface LeagueProviderRoster {
  externalTeamId: string;
  ownerExternalUserId: string | null;
  /** Starters first, in the league's configured slot order, then bench players. */
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
  /** rosterPositionSlots (from getLeagueInfo) determines each starter's rosterSlot label. */
  getRosters(externalLeagueId: string, rosterPositionSlots: string[]): Promise<LeagueProviderRoster[]>;
  getScoringSettings(externalLeagueId: string): Promise<Record<string, number>>;
  getLeagueMembers(externalLeagueId: string): Promise<LeagueProviderMember[]>;
}
