/**
 * PLACEHOLDER DATA — not real. Bye weeks land with the Player data pull; value scores are
 * Phase 3's league-adjusted, risk-adjusted projected value. Both are deterministic (hashed off
 * canonicalPlayerId) purely so roster pages render stable numbers instead of flickering on
 * every render/hydration — swap these call sites for real data once those phases exist.
 */

function hashCanonicalPlayerId(canonicalPlayerId: string): number {
  let hash = 0;
  for (let i = 0; i < canonicalPlayerId.length; i++) {
    hash = (hash * 31 + canonicalPlayerId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Dummy bye week in the plausible NFL range (weeks 4-14). */
export function getDummyByeWeek(canonicalPlayerId: string): number {
  return 4 + (hashCanonicalPlayerId(canonicalPlayerId) % 11);
}

/** Dummy 0-100 value score. */
export function getDummyValueScore(canonicalPlayerId: string): number {
  return hashCanonicalPlayerId(canonicalPlayerId) % 101;
}
