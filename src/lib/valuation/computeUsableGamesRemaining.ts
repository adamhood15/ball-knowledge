// 2026 NFL regular season: 18 weeks, 17 games per team (one bye week each).
export const TOTAL_REGULAR_SEASON_WEEKS = 18;
export const TOTAL_REGULAR_SEASON_GAMES = 17;

export function computeUsableGamesRemaining({
  currentWeek,
  byeWeek,
}: {
  currentWeek: number;
  byeWeek: number | null;
}): number {
  const weeksRemainingInclusive = Math.max(0, TOTAL_REGULAR_SEASON_WEEKS - currentWeek + 1);
  const byeStillAhead = byeWeek != null && byeWeek >= currentWeek;
  const usableGames = weeksRemainingInclusive - (byeStillAhead ? 1 : 0);

  return Math.min(TOTAL_REGULAR_SEASON_GAMES, Math.max(0, usableGames));
}
