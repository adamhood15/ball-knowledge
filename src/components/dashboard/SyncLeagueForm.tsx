"use client";

import { useActionState, useTransition } from "react";
import {
  lookupSleeperLeaguesAction,
  syncSelectedSleeperLeaguesAction,
  type LookupSleeperLeaguesState,
} from "@/app/dashboard/actions";
import { SleeperLeaguePicker } from "@/components/dashboard/SleeperLeaguePicker";
import { Button } from "@/components/ui/Button";

const initialState: LookupSleeperLeaguesState = { error: null, result: null };

export function SyncLeagueForm() {
  const [state, formAction, isPending] = useActionState(lookupSleeperLeaguesAction, initialState);
  const [, startTransition] = useTransition();

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-none border-2 border-muted-text/30 bg-background p-6 shadow-[4px_4px_0_0_var(--color-neutral-shadow)]">
        <span
          role="status"
          aria-label="Looking up leagues"
          className="h-6 w-6 animate-spin rounded-full border-2 border-card-border/30 border-t-secondary-accent"
        />
        <p className="text-sm text-muted-text">Looking up leagues…</p>
      </div>
    );
  }

  if (state.result) {
    const { sleeperUserId, sleeperUsername, leagues } = state.result;

    if (leagues.length === 0) {
      return (
        <p className="mx-auto text-sm text-muted-text">
          No leagues found for {sleeperUsername} this season.
        </p>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <p className="text-sm text-muted-text">Which of {sleeperUsername}&rsquo;s leagues do you want to add?</p>
        <SleeperLeaguePicker
          leagues={leagues}
          onConfirm={(externalLeagueIds) =>
            startTransition(() => syncSelectedSleeperLeaguesAction(sleeperUserId, externalLeagueIds))
          }
        />
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-none border-2 border-muted-text/30 bg-background p-6 shadow-[4px_4px_0_0_var(--color-neutral-shadow)]"
    >
      <label htmlFor="username" className="text-sm text-body-text">
        Sleeper username
      </label>
      <input
        id="username"
        name="username"
        type="text"
        placeholder="e.g. mahomes15"
        className="rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 text-body-text shadow-[3px_3px_0_0_var(--color-neutral-shadow)] placeholder:text-muted-text/60 focus:border-secondary-accent focus:shadow-[3px_3px_0_0_var(--color-secondary-accent)] focus:outline-none"
        required
      />
      <Button type="submit">Find Leagues</Button>
      {state.error ? (
        <p role="alert" className="text-sm text-secondary-accent">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
