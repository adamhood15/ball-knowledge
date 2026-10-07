"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function InviteTeamControl({
  teamId,
  pendingInviteEmail,
  sendInviteAction,
}: {
  teamId: string;
  pendingInviteEmail: string | null;
  sendInviteAction: (teamId: string, invitedEmail: string) => Promise<void>;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  if (pendingInviteEmail) {
    return <p className="px-3 text-xs text-muted-text">Invited: {pendingInviteEmail}</p>;
  }

  if (!isFormOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        className="px-3 text-left text-xs text-secondary-accent hover:text-card-border"
      >
        + Invite someone to claim this team
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => sendInviteAction(teamId, email));
        setIsFormOpen(false);
      }}
      className="flex items-center gap-2 px-3"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="teammate@example.com"
        className="flex-1 rounded-none border-2 border-muted-text/30 bg-background px-2 py-1 text-xs text-body-text shadow-[2px_2px_0_0_var(--color-neutral-shadow)] placeholder:text-muted-text/60 focus:border-secondary-accent focus:shadow-[2px_2px_0_0_var(--color-secondary-accent)] focus:outline-none"
      />
      <Button type="submit" disabled={isPending} className="px-3 py-1 text-xs">
        Send
      </Button>
    </form>
  );
}
