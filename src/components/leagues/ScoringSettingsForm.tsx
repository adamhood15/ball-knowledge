"use client";

import { useState, useTransition } from "react";
import {
  groupAndLabelScoringSettings,
  type ScoringStatCategory,
} from "@/lib/providers/league/sleeper/scoringStatLabels";
import { applyScoringPreset, type ScoringPreset } from "@/lib/leagueSettings/scoringPresets";
import { Button } from "@/components/ui/Button";

const CATEGORY_HEADINGS: Record<ScoringStatCategory, string> = {
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  defense: "Defense",
  specialTeams: "Special Teams",
  other: "Other",
};

const PRESET_BUTTONS: { preset: ScoringPreset; label: string }[] = [
  { preset: "STANDARD", label: "Standard" },
  { preset: "HALF_PPR", label: "Half-PPR" },
  { preset: "PPR", label: "PPR" },
];

export function ScoringSettingsForm({
  leagueId,
  initialScoringSettings,
  updateScoringSettingsAction,
}: {
  leagueId: string;
  initialScoringSettings: Record<string, number>;
  updateScoringSettingsAction: (leagueId: string, scoringSettings: Record<string, number>) => Promise<void>;
}) {
  const [scoringSettings, setScoringSettings] = useState(initialScoringSettings);
  const [isPending, startTransition] = useTransition();
  const groups = groupAndLabelScoringSettings(scoringSettings);

  function setStatPoints(statKey: string, points: number) {
    setScoringSettings((current) => ({ ...current, [statKey]: points }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {PRESET_BUTTONS.map(({ preset, label }) => (
          <Button
            key={preset}
            variant="secondary"
            onClick={() => setScoringSettings((current) => applyScoringPreset(current, preset))}
          >
            {label}
          </Button>
        ))}
      </div>
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <h3 className="font-display text-base text-body-text">{CATEGORY_HEADINGS[group.category]}</h3>
          <table className="w-full text-sm text-body-text">
            <tbody>
              {group.stats.map((stat) => (
                <tr key={stat.statKey} className="border-b border-card-border/10">
                  <td className="py-1">{stat.label}</td>
                  <td className="py-1 text-right">
                    <input
                      type="number"
                      step="any"
                      data-testid={`scoring-input-${stat.statKey}`}
                      value={stat.points}
                      onChange={(event) => setStatPoints(stat.statKey, Number(event.target.value))}
                      className="w-20 rounded border border-card-border/30 bg-background px-2 py-1 text-right text-body-text"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Button
        disabled={isPending}
        onClick={() => startTransition(() => updateScoringSettingsAction(leagueId, scoringSettings))}
        className="self-start"
      >
        {isPending ? "Saving…" : "Save Scoring Settings"}
      </Button>
    </div>
  );
}
