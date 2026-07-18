const SLEEPER_TEAM_LOGO_BASE_URL = "https://sleepercdn.com/images/team_logos/nfl";

/**
 * Team defense "players" in Sleeper's data use the NFL team abbreviation as their player_id
 * (e.g. "KC") and have no entry under the per-player headshot thumb endpoint — Sleeper serves
 * their image as a team logo instead, at a separate path, lowercased.
 */
export function sleeperTeamLogoUrl(teamAbbreviation: string): string {
  return `${SLEEPER_TEAM_LOGO_BASE_URL}/${teamAbbreviation.toLowerCase()}.png`;
}
