const SLEEPER_HEADSHOT_BASE_URL = "https://sleepercdn.com/content/nfl/players/thumb";

export function sleeperHeadshotUrl(canonicalPlayerId: string): string {
  return `${SLEEPER_HEADSHOT_BASE_URL}/${canonicalPlayerId}.jpg`;
}
