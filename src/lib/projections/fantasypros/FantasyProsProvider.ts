import type {
  InjuryRiskLevel,
  PlayerSeasonProjection,
  ProjectedStatLine,
  ProjectionsProvider,
} from "@/lib/projections/ProjectionsProvider";
import { deriveHeuristicVariance } from "@/lib/projections/heuristicVariance";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";

const FANTASYPROS_API_BASE_URL = "https://api.fantasypros.com/public/v2/json";

// FantasyPros' rest-of-season projections only accept one position per request (an unfiltered
// request silently defaults to RB, it does not return every position) — one call per position.
const PROJECTION_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

// --- Known free-tier API key limitations (as of 2026-07-23) — revisit once upgraded ---
// 1. Every projections response is capped at the top 10 players per position (confirmed via the
//    response's own `limit`/`public_api_limited`/`tier` fields), regardless of what `count`
//    reports as the true total (e.g. 131 for RB). A real league's rosterable player pool needs
//    far more than 60 total players across positions — this provider will silently under-cover
//    real rosters until the key is upgraded. Nothing to fix in code: it already just returns
//    however many players the API hands back, so this note is here so the gap isn't mistaken
//    for a bug the next time only ~10 players per position show up against the live API.
// 2. A week-specific query (`?week=1`) currently returns `{ count: "0", players: null }` on this
//    key — either week-level projections are paid-tier-only, or they simply aren't populated
//    this far ahead of the season (tested in the 2026 off-season). Either way, per-week
//    projections aren't usable right now, so `getSeasonProjections` sticks with the season-long
//    total + a fixed 17-game assumption (see computeUsableGamesRemaining.ts) rather than summing
//    real per-week numbers. Re-test `?week=N` once upgraded and/or closer to the season — if it
//    returns real data, prefer summing actual remaining weeks over the 17-game approximation.
// 3. Whether the injuries endpoint's `player_id` is the same ID space as this endpoint's `fpid`
//    couldn't be confirmed — the only overlapping test data available (10-per-position samples)
//    never included any of the currently-injured (deep-bench) players. Name-matching below is
//    the safe default either way; worth re-checking once a full player pool is available.

// FantasyPros calls the defense/special-teams slot "DST"; the rest of this app (roster
// construction, position colors, etc.) has always used "DEF" — translate at the boundary.
function toCanonicalPosition(fantasyProsPositionId: string): string {
  return fantasyProsPositionId === "DST" ? "DEF" : fantasyProsPositionId;
}

interface FantasyProsProjectionStats {
  pass_yds?: number;
  pass_tds?: number;
  pass_ints?: number;
  rush_yds?: number;
  rush_tds?: number;
  rec_rec?: number;
  rec_yds?: number;
  rec_tds?: number;
  fumbles?: number;
}

interface FantasyProsProjectionPlayer {
  fpid: number;
  name: string;
  position_id: string;
  team_id: string | null;
  stats: FantasyProsProjectionStats;
}

interface FantasyProsProjectionsResponse {
  players: FantasyProsProjectionPlayer[];
}

interface FantasyProsInjury {
  name: string;
  status: string;
}

interface FantasyProsInjuriesResponse {
  injuries: FantasyProsInjury[];
}

// FantasyPros' injuries endpoint doesn't share an ID space with the projections endpoint that's
// confirmed to align (they're separate internal systems) — match by normalized name instead,
// the same approach already used for the Sleeper player crosswalk.
const OUT_TIER_STATUSES = new Set(["OUT", "IR", "PUP", "NFI", "SUSPENDED", "DOUBTFUL"]);
const QUESTIONABLE_TIER_STATUSES = new Set(["QUESTIONABLE", "PROBABLE"]);

function injuryStatusToRiskLevel(status: string | undefined): InjuryRiskLevel {
  if (!status) return "HEALTHY";
  const normalizedStatus = status.toUpperCase();
  if (OUT_TIER_STATUSES.has(normalizedStatus)) return "OUT";
  if (QUESTIONABLE_TIER_STATUSES.has(normalizedStatus)) return "QUESTIONABLE";
  return "HEALTHY";
}

function toStatLine(stats: FantasyProsProjectionStats): ProjectedStatLine {
  return {
    pass_yd: stats.pass_yds ?? 0,
    pass_td: stats.pass_tds ?? 0,
    pass_int: stats.pass_ints ?? 0,
    rush_yd: stats.rush_yds ?? 0,
    rush_td: stats.rush_tds ?? 0,
    // FantasyPros' single "fumbles" field is treated as fumbles lost (the fantasy-relevant
    // stat) — the API doesn't separately break out lost-vs-recovered fumbles.
    fum_lost: stats.fumbles ?? 0,
    rec: stats.rec_rec ?? 0,
    rec_yd: stats.rec_yds ?? 0,
    rec_td: stats.rec_tds ?? 0,
  };
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

export class FantasyProsProvider implements ProjectionsProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: FetchImpl = fetch,
  ) {}

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${FANTASYPROS_API_BASE_URL}${path}`, {
      headers: { "x-api-key": this.apiKey },
    });
    if (!response.ok) {
      throw new Error(`FantasyPros API request failed: ${path} returned status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getSeasonProjections(season: string): Promise<PlayerSeasonProjection[]> {
    const [positionResponses, injuriesResponse] = await Promise.all([
      Promise.all(
        PROJECTION_POSITIONS.map((position) =>
          this.fetchJson<FantasyProsProjectionsResponse>(`/nfl/${season}/projections?position=${position}`),
        ),
      ),
      this.fetchJson<FantasyProsInjuriesResponse>("/nfl/injuries"),
    ]);

    const injuryRiskByNormalizedName = new Map<string, InjuryRiskLevel>(
      injuriesResponse.injuries.map((injury) => [
        normalizePlayerName(injury.name),
        injuryStatusToRiskLevel(injury.status),
      ]),
    );

    return positionResponses.flatMap((response) =>
      response.players.map((player) => {
        const position = toCanonicalPosition(player.position_id);
        const injuryRisk = injuryRiskByNormalizedName.get(normalizePlayerName(player.name)) ?? "HEALTHY";
        return {
          externalPlayerId: String(player.fpid),
          name: player.name,
          position,
          nflTeam: player.team_id ?? null,
          season,
          statLine: toStatLine(player.stats),
          injuryRisk,
          variance: deriveHeuristicVariance({ position, injuryRisk }),
        };
      }),
    );
  }
}
