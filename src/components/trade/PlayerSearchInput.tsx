"use client";

import { useEffect, useState } from "react";
import type { PlayerSearchResult } from "@/lib/trade/searchPlayers";
import { SearchIcon } from "@/components/icons/SearchIcon";

const SEARCH_DEBOUNCE_MS = 150;
const MINIMUM_QUERY_LENGTH = 2;

export function PlayerSearchInput({
  leagueId,
  excludeCanonicalPlayerIds,
  onSelectPlayer,
  placeholder = "Search players…",
}: {
  leagueId?: string;
  excludeCanonicalPlayerIds: string[];
  onSelectPlayer: (player: PlayerSearchResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([]);

  const isQueryLongEnough = query.trim().length >= MINIMUM_QUERY_LENGTH;

  useEffect(() => {
    if (!isQueryLongEnough) return;

    const abortController = new AbortController();
    const debounceTimeoutId = setTimeout(async () => {
      const params = new URLSearchParams({ q: query });
      if (leagueId) params.set("leagueId", leagueId);
      try {
        const response = await fetch(`/api/players/search?${params}`, { signal: abortController.signal });
        if (!response.ok) return;
        const body = (await response.json()) as { results: PlayerSearchResult[] };
        setSuggestions(body.results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") throw error;
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      clearTimeout(debounceTimeoutId);
    };
  }, [query, leagueId, isQueryLongEnough]);

  const visibleSuggestions = isQueryLongEnough
    ? suggestions.filter((player) => !excludeCanonicalPlayerIds.includes(player.canonicalPlayerId))
    : [];

  function selectPlayer(player: PlayerSearchResult) {
    onSelectPlayer(player);
    setQuery("");
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          data-testid="player-search-input"
          className="w-full rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 pr-10 text-sm text-body-text shadow-[3px_3px_0_0_var(--color-neutral-shadow)] placeholder:text-muted-text/60 focus:border-secondary-accent focus:shadow-[3px_3px_0_0_var(--color-secondary-accent)] focus:outline-none"
        />
        <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
      </div>
      {visibleSuggestions.length > 0 ? (
        <div
          data-testid="player-search-suggestions"
          className="absolute z-10 mt-1 w-full rounded-none border-2 border-muted-text/30 bg-background shadow-[3px_3px_0_0_var(--color-neutral-shadow)]"
        >
          {visibleSuggestions.map((player) => (
            <button
              key={player.canonicalPlayerId}
              type="button"
              onClick={() => selectPlayer(player)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-body-text hover:bg-card-border/10"
            >
              <span>{player.name}</span>
              <span className="text-xs text-muted-text">
                {player.position}
                {player.nflTeam ? ` · ${player.nflTeam}` : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
