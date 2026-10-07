export type LeagueMode = "REDRAFT" | "DYNASTY";

export interface LeagueProviderLeagueInfo {
  externalLeagueId: string;
  name: string;
  season: string;
  /** Raw starting-lineup slot list as the platform reports it, e.g. ["QB","RB","RB","FLEX","BN","BN"]. */
  rosterPositionSlots: string[];
  /** Stat category -> point value, in the platform's own stat category naming. */
  scoringSettings: Record<string, number>;
  leagueMode: LeagueMode;
}

export interface LeagueProviderRosterPlayer {
  canonicalPlayerId: string;
  /** The specific starting slot this player fills (e.g. "QB", "RB", "FLEX"), or null if benched. */
  rosterSlot: string | null;
}

export interface LeagueProviderTeamRecord {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Reverse-standings waiver queue position (1 = first priority, typically the worst team), or
   * null if the platform doesn't report one. */
  waiverPosition: number | null;
}

export interface LeagueProviderRoster {
  externalTeamId: string;
  ownerExternalUserId: string | null;
  /** Starters first, in the league's configured slot order, then bench players. */
  players: LeagueProviderRosterPlayer[];
  record: LeagueProviderTeamRecord;
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
