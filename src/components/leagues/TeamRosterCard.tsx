import { PlayerHeadshot } from "@/components/leagues/PlayerHeadshot";
import { getDummyValueScore } from "@/lib/design/dummyPlayerStats";
import { getValueScoreColorClasses } from "@/lib/design/valueScoreColors";
import { playerImageUrl } from "@/lib/providers/league/sleeper/playerImageUrl";

export interface TeamRosterPlayer {
  canonicalPlayerId: string;
  name: string | null;
  position: string | null;
  nflTeam: string | null;
  /** Real bye week, or null if the player hasn't been backfilled with one yet. */
  byeWeek: number | null;
  /** Real league-adjusted, risk-adjusted rest-of-season projected value (Phase 3's valuation
   * engine), or null when no FantasyPros projection was found for this player. */
  projectedValue: number | null;
  /** The league's starting slot this player fills (e.g. "QB", "FLEX"), or null if benched. */
  rosterSlot: string | null;
}

function PlayerRow({ player, slotLabel }: { player: TeamRosterPlayer; slotLabel: string }) {
  const displayName = player.name ?? `Unknown player (${player.canonicalPlayerId})`;
  const valueScore = getDummyValueScore(player.canonicalPlayerId);
  const valueScoreColors = getValueScoreColorClasses(valueScore);

  return (
    <div data-testid="roster-player-row" className="flex items-center gap-3 border-b border-card-border/10 py-2 last:border-b-0">
      <PlayerHeadshot src={playerImageUrl(player)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-body-text" data-testid="roster-player-name">
          {displayName}
        </span>
        <span className="truncate text-xs text-muted-text">
          {slotLabel}
          {player.nflTeam ? ` · ${player.nflTeam}` : ""}
          {player.byeWeek != null ? ` · Bye ${player.byeWeek}` : ""}
        </span>
      </div>
      {player.projectedValue != null ? (
        <span data-testid="player-projected-value" className="flex-shrink-0 text-xs font-semibold text-body-text">
          {player.projectedValue.toFixed(1)}
        </span>
      ) : null}
      <span
        data-testid="player-value-score"
        className={`flex-shrink-0 rounded-none border ${valueScoreColors.border} px-2 py-1 text-xs font-semibold ${valueScoreColors.background} ${valueScoreColors.text}`}
      >
        {valueScore}
      </span>
    </div>
  );
}

export function TeamRosterCard({ players }: { players: TeamRosterPlayer[] }) {
  const starters = players.filter((player) => player.rosterSlot !== null);
  const bench = players.filter((player) => player.rosterSlot === null);

  return (
    <div data-testid="roster-card" className="flex flex-col gap-1 bg-background p-4">
      {starters.map((player) => (
        <PlayerRow key={player.canonicalPlayerId} player={player} slotLabel={player.rosterSlot!} />
      ))}
      {bench.length > 0 ? (
        <div data-testid="bench-separator" className="pt-3 pb-1 text-xs uppercase tracking-wide text-muted-text">
          Bench
        </div>
      ) : null}
      {bench.map((player) => (
        <PlayerRow key={player.canonicalPlayerId} player={player} slotLabel={player.position ?? "?"} />
      ))}
    </div>
  );
}
