// 2026 NFL regular-season bye weeks by team, confirmed against nfl.com's schedule release
// (https://www.nfl.com/news/2026-nfl-schedule-release-every-team-bye-week). A bye week is a
// team-schedule fact, not a per-player one — every player on a team shares it — so this table
// needs a manual update once a year when the next season's schedule is released, rather than
// depending on a per-player API field (which would also be subject to FantasyPros' free-tier
// per-position sample cap, see FantasyProsProvider.ts).
const TEAM_BYE_WEEKS_2026: Record<string, number> = {
  KC: 5,
  CAR: 5,
  CIN: 6,
  DET: 6,
  MIA: 6,
  MIN: 6,
  BUF: 7,
  JAX: 7,
  LAC: 7,
  WAS: 7,
  HOU: 8,
  NO: 8,
  NYG: 8,
  SF: 8,
  PIT: 9,
  TEN: 9,
  CHI: 10,
  DEN: 10,
  PHI: 10,
  TB: 10,
  ATL: 11,
  CLE: 11,
  GB: 11,
  LAR: 11,
  NE: 11,
  SEA: 11,
  BAL: 13,
  IND: 13,
  LV: 13,
  NYJ: 13,
  ARI: 14,
  DAL: 14,
};

export function getTeamByeWeek(nflTeam: string | null): number | null {
  if (!nflTeam) return null;
  return TEAM_BYE_WEEKS_2026[nflTeam] ?? null;
}
