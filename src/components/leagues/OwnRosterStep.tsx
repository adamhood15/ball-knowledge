"use client";

import { useState } from "react";
import { PlayerSearchInput } from "@/components/trade/PlayerSearchInput";
import { Button } from "@/components/ui/Button";
import { getPositionColorClasses } from "@/lib/design/positionColors";
import { expandRosterConstructionToSlots } from "@/lib/leagueSettings/rosterSlotOrder";
import type { PlayerSearchResult } from "@/lib/trade/searchPlayers";

const BENCH_SLOT = "BENCH";

export interface OwnRosterPlayer {
  canonicalPlayerId: string;
  rosterSlot: string | null;
}

export function OwnRosterStep({
  rosterConstruction,
  onContinue,
  onSkip,
}: {
  rosterConstruction: Record<string, number>;
  onContinue: (players: OwnRosterPlayer[]) => void;
  onSkip: () => void;
}) {
  const slots = expandRosterConstructionToSlots(rosterConstruction);
  const [selections, setSelections] = useState<Record<number, PlayerSearchResult>>({});

  function selectPlayer(slotIndex: number, player: PlayerSearchResult) {
    setSelections((current) => ({ ...current, [slotIndex]: player }));
  }

  function clearSlot(slotIndex: number) {
    setSelections((current) => {
      const next = { ...current };
      delete next[slotIndex];
      return next;
    });
  }

  function handleContinue() {
    const players = slots
      .map((slot, slotIndex) => ({ slot, slotIndex, player: selections[slotIndex] }))
      .filter((entry) => entry.player)
      .map(({ slot, player }) => ({
        canonicalPlayerId: player!.canonicalPlayerId,
        rosterSlot: slot === BENCH_SLOT ? null : slot,
      }));
    onContinue(players);
  }

  const excludeCanonicalPlayerIds = Object.values(selections).map((player) => player.canonicalPlayerId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-text">
        Fill in your roster now, or skip and come back to it later.
      </p>
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {slots.map((slot, slotIndex) => {
          const colors = getPositionColorClasses(slot);
          const selectedPlayer = selections[slotIndex];
          return (
            <div
              key={slotIndex}
              data-testid="own-roster-slot-row"
              data-slot={slot}
              className={`flex items-center gap-3 rounded-none border-2 px-3 py-2 shadow-[2px_2px_0_0_var(--color-neutral-shadow)] ${colors.background} ${colors.border}`}
            >
              <span className={`w-20 flex-shrink-0 text-sm font-semibold ${colors.text}`}>{slot}</span>
              {selectedPlayer ? (
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-sm text-body-text">{selectedPlayer.name}</span>
                  <button
                    type="button"
                    aria-label={`Clear ${slot} selection`}
                    onClick={() => clearSlot(slotIndex)}
                    className="text-xs text-muted-text hover:text-card-border"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <PlayerSearchInput
                    excludeCanonicalPlayerIds={excludeCanonicalPlayerIds}
                    onSelectPlayer={(player) => selectPlayer(slotIndex, player)}
                    placeholder={`Search for a ${slot}…`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Button onClick={handleContinue}>Finish</Button>
        <Button variant="secondary" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
