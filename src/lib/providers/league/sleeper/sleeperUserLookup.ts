const SLEEPER_API_BASE_URL = "https://api.sleeper.app/v1";

type FetchImpl = (url: string) => Promise<Response>;

interface SleeperUserLookupResponse {
  user_id: string;
  display_name: string;
}

interface SleeperStateResponse {
  league_season: string;
  week: number;
}

interface SleeperUserLeagueResponse {
  league_id: string;
  name: string;
  previous_league_id: string | null;
}

export interface SleeperResolvedUser {
  externalUserId: string;
  displayName: string;
}

export interface SleeperUserLeague {
  externalLeagueId: string;
  name: string;
}

/**
 * Sleeper responds with HTTP 200 and a JSON body of `null` for a username that doesn't exist
 * (not a 404), so a null/falsy body — not response.ok — is what signals "not found."
 */
export async function resolveSleeperUsername({
  username,
  fetchImpl = fetch,
}: {
  username: string;
  fetchImpl?: FetchImpl;
}): Promise<SleeperResolvedUser | null> {
  const response = await fetchImpl(`${SLEEPER_API_BASE_URL}/user/${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error(`Sleeper API request failed: user lookup returned status ${response.status}`);
  }
  const user = (await response.json()) as SleeperUserLookupResponse | null;
  if (!user) return null;
  return { externalUserId: user.user_id, displayName: user.display_name };
}

export async function getCurrentNflSeason({ fetchImpl = fetch }: { fetchImpl?: FetchImpl } = {}): Promise<string> {
  const response = await fetchImpl(`${SLEEPER_API_BASE_URL}/state/nfl`);
  if (!response.ok) {
    throw new Error(`Sleeper API request failed: state lookup returned status ${response.status}`);
  }
  const state = (await response.json()) as SleeperStateResponse;
  return state.league_season;
}

/** Sleeper reports week 0 during the off-season — computeUsableGamesRemaining already treats
 * that as "full season ahead," so no special-casing is needed here. */
export async function getCurrentNflWeek({ fetchImpl = fetch }: { fetchImpl?: FetchImpl } = {}): Promise<number> {
  const response = await fetchImpl(`${SLEEPER_API_BASE_URL}/state/nfl`);
  if (!response.ok) {
    throw new Error(`Sleeper API request failed: state lookup returned status ${response.status}`);
  }
  const state = (await response.json()) as SleeperStateResponse;
  return state.week;
}

async function fetchSleeperUserLeaguesForSeason(
  externalUserId: string,
  season: string,
  fetchImpl: FetchImpl,
): Promise<SleeperUserLeagueResponse[]> {
  const response = await fetchImpl(`${SLEEPER_API_BASE_URL}/user/${externalUserId}/leagues/nfl/${season}`);
  if (!response.ok) {
    throw new Error(`Sleeper API request failed: user leagues lookup returned status ${response.status}`);
  }
  return response.json() as Promise<SleeperUserLeagueResponse[]>;
}

/**
 * A dynasty/keeper league gets a brand new league_id each season it rolls over (linked back via
 * previous_league_id), and that rollover doesn't happen the moment a season ends — leagues sit
 * at last season's id, with status "complete", until the commissioner (or Sleeper) creates the
 * new season. Querying only the current season misses those. This checks the current season
 * plus the one immediately before it, and includes a previous-season league only when nothing
 * in the current season lists it as a predecessor (i.e. it hasn't rolled over yet) — so a
 * league that HAS rolled over is only returned once, under its new id, and nothing older than
 * one season back (a genuinely archived league) is ever pulled in.
 */
export async function getSleeperUserLeagues({
  externalUserId,
  season,
  fetchImpl = fetch,
}: {
  externalUserId: string;
  season: string;
  fetchImpl?: FetchImpl;
}): Promise<SleeperUserLeague[]> {
  const previousSeason = String(Number(season) - 1);
  const [currentSeasonLeagues, previousSeasonLeagues] = await Promise.all([
    fetchSleeperUserLeaguesForSeason(externalUserId, season, fetchImpl),
    fetchSleeperUserLeaguesForSeason(externalUserId, previousSeason, fetchImpl),
  ]);

  const rolledOverFromLeagueIds = new Set(
    currentSeasonLeagues.map((league) => league.previous_league_id).filter((id): id is string => Boolean(id)),
  );
  const notYetRolledOver = previousSeasonLeagues.filter((league) => !rolledOverFromLeagueIds.has(league.league_id));

  return [...currentSeasonLeagues, ...notYetRolledOver].map((league) => ({
    externalLeagueId: league.league_id,
    name: league.name,
  }));
}
