"use client";

import { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { getPositionColorClasses } from "@/lib/design/positionColors";
import { ROSTER_SLOT_ORDER } from "@/lib/leagueSettings/rosterSlotOrder";

const DRAG_DATA_FORMAT = "application/x-roster-slot";

const SLOT_BUTTON_BASE_CLASSES =
  "flex h-6 w-6 items-center justify-center rounded-none border text-sm font-bold leading-none transition-all duration-150";

export function RosterConstructionStep({
  initialRosterConstruction,
  onContinue,
}: {
  initialRosterConstruction: Record<string, number>;
  onContinue: (rosterConstruction: Record<string, number>) => void;
}) {
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>(initialRosterConstruction);

  function adjustSlotCount(slot: string, delta: number) {
    setSlotCounts((current) => ({ ...current, [slot]: Math.max(0, (current[slot] ?? 0) + delta) }));
  }

  function handleContinue() {
    const rosterConstruction = Object.fromEntries(
      Object.entries(slotCounts).filter(([, count]) => count > 0),
    );
    onContinue(rosterConstruction);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const slot = event.dataTransfer.getData(DRAG_DATA_FORMAT);
    if (slot) adjustSlotCount(slot, 1);
  }

  const availableSlots = ROSTER_SLOT_ORDER.filter((slot) => (slotCounts[slot] ?? 0) === 0);

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="roster-slot-list"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto"
      >
        {ROSTER_SLOT_ORDER.flatMap((slot) => {
          const count = slotCounts[slot] ?? 0;
          const colors = getPositionColorClasses(slot);
          return Array.from({ length: count }, (_, instanceIndex) => (
            <div
              key={`${slot}-${instanceIndex}`}
              data-testid="roster-slot-row"
              data-position={slot}
              className={`flex items-center justify-between gap-3 rounded-none border-2 px-3 py-2 shadow-[2px_2px_0_0_var(--color-neutral-shadow)] ${colors.background} ${colors.border}`}
            >
              <span className={`text-sm font-semibold ${colors.text}`}>{slot}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Remove a ${slot}`}
                  onClick={() => adjustSlotCount(slot, -1)}
                  className={`${SLOT_BUTTON_BASE_CLASSES} ${colors.border} ${colors.text} ${colors.hoverAccent}`}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label={`Add another ${slot}`}
                  onClick={() => adjustSlotCount(slot, 1)}
                  className={`${SLOT_BUTTON_BASE_CLASSES} ${colors.border} ${colors.text} ${colors.hoverAccent}`}
                >
                  +
                </button>
              </div>
            </div>
          ));
        })}
      </div>

      {availableSlots.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-card-border/20 pt-4">
          <span className="font-accent text-xs uppercase tracking-wide text-muted-text">
            Drag onto your roster to add back
          </span>
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => {
              const colors = getPositionColorClasses(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  draggable
                  data-testid={`available-position-${slot}`}
                  onDragStart={(event) => event.dataTransfer.setData(DRAG_DATA_FORMAT, slot)}
                  onClick={() => adjustSlotCount(slot, 1)}
                  className={`cursor-grab rounded-none border-2 border-dashed px-3 py-1.5 text-sm font-semibold active:cursor-grabbing ${colors.background} ${colors.border} ${colors.text}`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <Button onClick={handleContinue} className="self-start">
        Continue
      </Button>
    </div>
  );
}
