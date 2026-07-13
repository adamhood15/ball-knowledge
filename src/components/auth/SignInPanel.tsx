"use client";

type SignInPanelProps = {
  onGoogleSignIn: () => void;
  onEmailSignIn: (formData: FormData) => void;
};

export function SignInPanel({ onGoogleSignIn, onEmailSignIn }: SignInPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-lg border border-card-border/40 bg-background p-8">
      <button
        type="button"
        onClick={onGoogleSignIn}
        className="rounded-md border border-card-border px-4 py-2 font-medium text-body-text transition hover:bg-card-border/10"
      >
        Continue with Google
      </button>

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
          className="rounded-md border border-muted-text/40 bg-transparent px-3 py-2 text-body-text placeholder:text-muted-text/60 focus:border-secondary-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-secondary-accent px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          Send a magic link
        </button>
      </form>
    </div>
  );
}
