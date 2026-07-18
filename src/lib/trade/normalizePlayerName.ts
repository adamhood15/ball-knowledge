/**
 * Lowercases and strips apostrophes, so a search query typed without one (e.g. "devon") still
 * matches a stored name that has one (e.g. "De'Von Achane"). Applied identically when writing
 * Player.normalizedName and when normalizing an incoming search query, so they stay comparable.
 */
export function normalizePlayerName(name: string): string {
  return name.toLowerCase().replace(/'/g, "");
}
