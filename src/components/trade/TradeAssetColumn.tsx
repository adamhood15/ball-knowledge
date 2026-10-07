"use client";

import { PlayerSearchInput } from "@/components/trade/PlayerSearchInput";
import { PlayerHeadshot } from "@/components/leagues/PlayerHeadshot";
import { IconButton } from "@/components/ui/IconButton";
import { playerImageUrl } from "@/lib/providers/league/sleeper/playerImageUrl";
import type { PlayerSearchResult } from "@/lib/trade/searchPlayers";

const MAX_ASSETS_PER_SIDE = 5;

export function TradeAssetColumn({
  label,
  leagueId,
  assets,
  onAddPlayer,
  onRemovePlayer,
  searchPlaceholder,
}: {
  label: string;
  leagueId?: string;
  assets: PlayerSearchResult[];
  onAddPlayer: (player: PlayerSearchResult) => void;
  onRemovePlayer: (canonicalPlayerId: string) => void;
  searchPlaceholder?: string;
}) {
  const isFull = assets.length >= MAX_ASSETS_PER_SIDE;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-accent text-base tracking-wide text-muted-text">{label}</h2>
      {isFull ? (
        <p className="text-xs text-muted-text">Maximum of {MAX_ASSETS_PER_SIDE} players reached.</p>
      ) : (
        <PlayerSearchInput
          leagueId={leagueId}
          excludeCanonicalPlayerIds={assets.map((asset) => asset.canonicalPlayerId)}
          onSelectPlayer={onAddPlayer}
          placeholder={searchPlaceholder}
        />
      )}
      <div className="flex flex-col gap-2">
        {assets.map((asset) => (
          <div
            key={asset.canonicalPlayerId}
            data-testid="trade-asset-card"
            className="flex items-center gap-3 rounded-none border-2 border-muted-text/30 p-2 shadow-[2px_2px_0_0_var(--color-neutral-shadow)]"
          >
            <PlayerHeadshot src={playerImageUrl(asset)} className="h-10 w-10" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-body-text">{asset.name}</span>
              <span className="truncate text-xs text-muted-text">
                {asset.position}
                {asset.nflTeam ? ` · ${asset.nflTeam}` : ""}
              </span>
            </div>
            <IconButton
              onClick={() => onRemovePlayer(asset.canonicalPlayerId)}
              aria-label={`Remove ${asset.name}`}
              className="flex-shrink-0"
            >
              ✕
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
}
