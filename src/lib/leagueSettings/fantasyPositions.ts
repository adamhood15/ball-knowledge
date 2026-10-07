// The only real NFL positions this app's roster construction and search care about.
// Excludes offensive line (G/T/C/OL/OT/OG), special teams (LS/P), and IDP positions
// (LB/CB/DB/S/FS/SS/DE/DT/NT) — none of which are draftable/startable in a standard
// fantasy league, even though Sleeper's player list includes all of them.
export const FANTASY_RELEVANT_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function isFantasyRelevantPosition(position: string | null): boolean {
  if (!position) return false;
  return (FANTASY_RELEVANT_POSITIONS as string[]).includes(position);
}
