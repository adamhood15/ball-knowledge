import { getLastDevMagicLinkUrl } from "@/lib/dev-mail";

export default function VerifyRequestPage() {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const devMagicLinkUrl = isDevelopment ? getLastDevMagicLinkUrl() : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-card-border/40 bg-background p-8 text-center">
        <h2 className="font-display text-2xl text-body-text">Check your email</h2>
        <p className="text-sm text-muted-text">
          We sent you a sign-in link. Click it to finish signing in — you can close this tab.
        </p>
        {devMagicLinkUrl ? (
          <div className="mt-4 flex flex-col gap-2 rounded-md border border-secondary-accent/40 p-4 text-left">
            <p className="text-xs text-muted-text">
              Dev mode: no real email was sent. Use this link instead.
            </p>
            <a
              href={devMagicLinkUrl}
              className="break-all text-sm text-secondary-accent underline hover:opacity-80"
            >
              {devMagicLinkUrl}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
