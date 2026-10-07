"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface SleeperLeagueOption {
  externalLeagueId: string;
  name: string;
}

export function SleeperLeaguePicker({
  leagues,
  onConfirm,
}: {
  leagues: SleeperLeagueOption[];
  onConfirm: (selectedExternalLeagueIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(externalLeagueId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(externalLeagueId)) {
        next.delete(externalLeagueId);
      } else {
        next.add(externalLeagueId);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {leagues.map((league) => {
          const isSelected = selectedIds.has(league.externalLeagueId);
          return (
            <button
              key={league.externalLeagueId}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              data-testid={`sleeper-league-card-${league.externalLeagueId}`}
              onClick={() => toggle(league.externalLeagueId)}
              className={[
                "aspect-square w-full rounded-none border-2 bg-background p-4 text-center transition-all duration-150",
                isSelected
                  ? "border-card-border shadow-[3px_3px_0_0_var(--color-card-border)]"
                  : "border-muted-text/30 shadow-[2px_2px_0_0_var(--color-neutral-shadow)] hover:border-card-border hover:shadow-[3px_3px_0_0_var(--color-card-border)]",
              ].join(" ")}
            >
              <span className="font-display text-sm text-body-text">{league.name}</span>
            </button>
          );
        })}
      </div>
      <Button disabled={selectedIds.size === 0} onClick={() => onConfirm([...selectedIds])} className="self-center">
        Confirm
      </Button>
    </div>
  );
}
