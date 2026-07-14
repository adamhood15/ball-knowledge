export interface TeamRosterPlayer {
  canonicalPlayerId: string;
  name: string | null;
  position: string | null;
  isStarter: boolean;
}

export function TeamRosterCard({ teamName, players }: { teamName: string; players: TeamRosterPlayer[] }) {
  const starters = players.filter((player) => player.isStarter);
  const bench = players.filter((player) => !player.isStarter);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-card-border/30 bg-background p-4">
      <h3 className="font-display text-lg text-body-text">{teamName}</h3>
      <ul className="flex flex-col gap-1 text-sm text-body-text">
        {[...starters, ...bench].map((player) => (
          <li key={player.canonicalPlayerId} className="flex items-center justify-between">
            <span data-testid="roster-player-name">{player.name ?? `Unknown player (${player.canonicalPlayerId})`}</span>
            <span className="text-muted-text">
              {player.position ?? "?"}
              {player.isStarter ? "" : " · Bench"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
