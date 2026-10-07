"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

const BENCH_SLOT_KEY = "BENCH";

function sortSlotKeys(slotKeys: string[]): string[] {
  return [...slotKeys].sort((a, b) => {
    if (a === BENCH_SLOT_KEY) return 1;
    if (b === BENCH_SLOT_KEY) return -1;
    return a.localeCompare(b);
  });
}

export function RosterConstructionForm({
  leagueId,
  initialRosterConstruction,
  updateRosterConstructionAction,
}: {
  leagueId: string;
  initialRosterConstruction: Record<string, number>;
  updateRosterConstructionAction: (leagueId: string, rosterConstruction: Record<string, number>) => Promise<void>;
}) {
  const [rosterConstruction, setRosterConstruction] = useState(initialRosterConstruction);
  const [newSlotName, setNewSlotName] = useState("");
  const [isPending, startTransition] = useTransition();

  function setSlotCount(slotKey: string, count: number) {
    setRosterConstruction((current) => ({ ...current, [slotKey]: count }));
  }

  function removeSlot(slotKey: string) {
    setRosterConstruction((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => key !== slotKey)),
    );
  }

  function addSlot() {
    const slotKey = newSlotName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!slotKey || slotKey in rosterConstruction) return;
    setRosterConstruction((current) => ({ ...current, [slotKey]: 1 }));
    setNewSlotName("");
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-sm text-body-text">
        <tbody>
          {sortSlotKeys(Object.keys(rosterConstruction)).map((slotKey) => (
            <tr key={slotKey} className="border-b border-card-border/10">
              <td className="py-1">{slotKey}</td>
              <td className="py-1 text-right">
                <input
                  type="number"
                  min={0}
                  step={1}
                  data-testid={`roster-slot-count-${slotKey}`}
                  value={rosterConstruction[slotKey]}
                  onChange={(event) => setSlotCount(slotKey, Number(event.target.value))}
                  className="w-16 rounded border border-card-border/30 bg-background px-2 py-1 text-right text-body-text"
                />
              </td>
              <td className="py-1 pl-2 text-right">
                <button
                  type="button"
                  data-testid={`roster-slot-remove-${slotKey}`}
                  onClick={() => removeSlot(slotKey)}
                  className="text-xs text-muted-text hover:text-secondary-accent"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="e.g. SUPER_FLEX"
          data-testid="new-slot-name"
          value={newSlotName}
          onChange={(event) => setNewSlotName(event.target.value)}
          className="rounded border border-card-border/30 bg-background px-2 py-1 text-sm text-body-text"
        />
        <Button variant="secondary" onClick={addSlot}>
          Add Slot
        </Button>
      </div>
      <Button
        disabled={isPending}
        onClick={() => startTransition(() => updateRosterConstructionAction(leagueId, rosterConstruction))}
        className="self-start"
      >
        {isPending ? "Saving…" : "Save Roster Construction"}
      </Button>
    </div>
  );
}
