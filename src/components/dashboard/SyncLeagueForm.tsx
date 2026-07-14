"use client";

import { useActionState } from "react";
import { syncSleeperLeagueAction, type SyncLeagueActionState } from "@/app/dashboard/actions";

const initialState: SyncLeagueActionState = { error: null };

export function SyncLeagueForm() {
  const [state, formAction, isPending] = useActionState(syncSleeperLeagueAction, initialState);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-lg border border-card-border/30 bg-background p-6">
        <span
          role="status"
          aria-label="Syncing league"
          className="h-6 w-6 animate-spin rounded-full border-2 border-card-border/30 border-t-secondary-accent"
        />
        <p className="text-sm text-muted-text">Syncing league…</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-lg flex-col gap-3 rounded-lg border border-card-border/30 bg-background p-6"
    >
      <label htmlFor="sleeperLeagueId" className="text-sm text-body-text">
        Sleeper league ID
      </label>
      <input
        id="sleeperLeagueId"
        name="sleeperLeagueId"
        type="text"
        placeholder="e.g. 1347028745252257792"
        className="rounded-md border border-card-border/30 bg-background px-3 py-2 text-body-text"
        required
      />
      <button
        type="submit"
        className="rounded-md border border-card-border/60 px-4 py-2 text-body-text"
      >
        Sync league
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-secondary-accent">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
