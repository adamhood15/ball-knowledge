"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";

const TEAM_COUNT_OPTIONS = [4, 6, 8, 10, 12, 14, 16, 18, 20];
const DEFAULT_TEAM_COUNT = 12;

export interface LeagueDetails {
  name: string;
  teamCount: number;
}

export function LeagueDetailsStep({ onContinue }: { onContinue: (details: LeagueDetails) => void }) {
  const [name, setName] = useState("");
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const nameInputId = useId();
  const teamCountSelectId = useId();

  const canContinue = name.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={nameInputId} className="text-sm text-body-text">
          League name
        </label>
        <input
          id={nameInputId}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 text-body-text shadow-[3px_3px_0_0_var(--color-neutral-shadow)] focus:border-secondary-accent focus:shadow-[3px_3px_0_0_var(--color-secondary-accent)] focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={teamCountSelectId} className="text-sm text-body-text">
          Number of teams
        </label>
        <select
          id={teamCountSelectId}
          value={teamCount}
          onChange={(event) => setTeamCount(Number(event.target.value))}
          className="w-fit rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 text-body-text shadow-[3px_3px_0_0_var(--color-neutral-shadow)] focus:border-secondary-accent focus:shadow-[3px_3px_0_0_var(--color-secondary-accent)] focus:outline-none"
        >
          {TEAM_COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>
      <Button
        disabled={!canContinue}
        onClick={() => onContinue({ name: name.trim(), teamCount })}
        className="self-start"
      >
        Continue
      </Button>
    </div>
  );
}
