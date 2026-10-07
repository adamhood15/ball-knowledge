"use client";

import { useState } from "react";
import { TradeAssetColumn } from "@/components/trade/TradeAssetColumn";
import { Button } from "@/components/ui/Button";
import type { PlayerSearchResult } from "@/lib/trade/searchPlayers";

const MAX_ASSETS_PER_SIDE = 5;

function addPlayer(assets: PlayerSearchResult[], player: PlayerSearchResult): PlayerSearchResult[] {
  if (assets.length >= MAX_ASSETS_PER_SIDE) return assets;
  return [...assets, player];
}

function removePlayer(assets: PlayerSearchResult[], canonicalPlayerId: string): PlayerSearchResult[] {
  return assets.filter((asset) => asset.canonicalPlayerId !== canonicalPlayerId);
}

export function TradeSearchStep({
  leagueId,
  onAnalyze,
}: {
  leagueId?: string;
  onAnalyze: (givingAssets: PlayerSearchResult[], receivingAssets: PlayerSearchResult[]) => void;
}) {
  const [givingAssets, setGivingAssets] = useState<PlayerSearchResult[]>([]);
  const [receivingAssets, setReceivingAssets] = useState<PlayerSearchResult[]>([]);

  const canAnalyze = givingAssets.length > 0 && receivingAssets.length > 0;

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
      <TradeAssetColumn
        label="You Give"
        leagueId={leagueId}
        assets={givingAssets}
        onAddPlayer={(player) => setGivingAssets((current) => addPlayer(current, player))}
        onRemovePlayer={(id) => setGivingAssets((current) => removePlayer(current, id))}
        searchPlaceholder="Search players to trade away…"
      />
      <TradeAssetColumn
        label="You Get"
        leagueId={leagueId}
        assets={receivingAssets}
        onAddPlayer={(player) => setReceivingAssets((current) => addPlayer(current, player))}
        onRemovePlayer={(id) => setReceivingAssets((current) => removePlayer(current, id))}
        searchPlaceholder="Search players to receive…"
      />
      <Button
        disabled={!canAnalyze}
        onClick={() => onAnalyze(givingAssets, receivingAssets)}
        className="col-span-full mx-auto"
      >
        Analyze
      </Button>
    </div>
  );
}
