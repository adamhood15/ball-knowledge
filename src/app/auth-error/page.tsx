import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  Verification: "That sign-in link is invalid or has expired. Request a new one below.",
  AccessDenied: "That sign-in attempt was denied.",
  Configuration: "There's a configuration problem with sign-in. Please try again shortly.",
};

const DEFAULT_ERROR_MESSAGE = "Something went wrong while signing in. Please try again.";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && ERROR_MESSAGES[error]) ?? DEFAULT_ERROR_MESSAGE;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-card-border/40 bg-background p-8 text-center">
        <h2 className="font-display text-2xl text-body-text">Sign-in problem</h2>
        <p className="text-sm text-muted-text">{message}</p>
        <Link href="/sign-in" className="text-sm text-secondary-accent underline hover:opacity-80">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
