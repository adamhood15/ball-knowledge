"use client";

import { Button } from "@/components/ui/Button";

type SignInPanelProps = {
  onGoogleSignIn: () => void;
  onEmailSignIn: (formData: FormData) => void;
};

export function SignInPanel({ onGoogleSignIn, onEmailSignIn }: SignInPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-none border-2 border-muted-text/30 bg-background p-8 shadow-[4px_4px_0_0_var(--color-neutral-shadow)]">
      <Button variant="secondary" onClick={onGoogleSignIn}>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-muted-text text-sm">
        <div className="h-px flex-1 bg-muted-text/30" />
        or
        <div className="h-px flex-1 bg-muted-text/30" />
      </div>

      <form
        action={(formData: FormData) => onEmailSignIn(formData)}
        className="flex flex-col gap-3"
      >
        <label htmlFor="email" className="text-sm text-muted-text">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 text-body-text shadow-[3px_3px_0_0_var(--color-neutral-shadow)] placeholder:text-muted-text/60 focus:border-secondary-accent focus:shadow-[3px_3px_0_0_var(--color-secondary-accent)] focus:outline-none"
        />
        <Button type="submit">Send a magic link</Button>
      </form>
    </div>
  );
}
