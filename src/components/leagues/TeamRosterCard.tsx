export interface TeamRosterPlayer {
  canonicalPlayerId: string;
  name: string | null;
  position: string | null;
  nflTeam: string | null;
  /** The league's starting slot this player fills (e.g. "QB", "FLEX"), or null if benched. */
  rosterSlot: string | null;
}

export function TeamRosterCard({ teamName, players }: { teamName: string; players: TeamRosterPlayer[] }) {
  const starters = players.filter((player) => player.rosterSlot !== null);
  const bench = players.filter((player) => player.rosterSlot === null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-card-border/30 bg-background p-4">
      <h3 className="font-display text-lg text-body-text">{teamName}</h3>
      <table className="w-full text-sm text-body-text">
        <tbody>
          {starters.map((player) => (
            <tr key={player.canonicalPlayerId}>
              <td className="w-16 py-1 text-muted-text">{player.rosterSlot}</td>
              <td className="py-1" data-testid="roster-player-name">
                {player.name ?? `Unknown player (${player.canonicalPlayerId})`}
              </td>
            </tr>
          ))}
          {bench.length > 0 ? (
            <tr>
              <td colSpan={2} className="pt-3 pb-1 text-xs uppercase tracking-wide text-muted-text">
                Bench
              </td>
            </tr>
          ) : null}
          {bench.map((player) => (
            <tr key={player.canonicalPlayerId}>
              <td className="w-16 py-1 text-muted-text">{player.position ?? "?"}</td>
              <td className="py-1" data-testid="roster-player-name">
                {player.name ?? `Unknown player (${player.canonicalPlayerId})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
