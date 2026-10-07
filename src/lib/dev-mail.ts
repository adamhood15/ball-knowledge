/**
 * Dev-only magic-link "sender": logs the sign-in URL to the server console
 * instead of dispatching real email. Swap for a real SMTP/Resend transport
 * once the project has a transactional email provider (see AGENTS.md section 6).
 */
let lastMagicLinkUrl: string | null = null;

export function logMagicLinkToConsole({
  identifier,
  url,
}: {
  identifier: string;
  url: string;
}) {
  lastMagicLinkUrl = url;
  console.log(
    `\n[dev-mail] Magic sign-in link for ${identifier}:\n${url}\n`
  );
}

/** Lets the dev-only "check your email" page surface the link directly, no inbox required. */
export function getLastDevMagicLinkUrl(): string | null {
  return lastMagicLinkUrl;
}

/**
 * Dev-only league-invite "sender": logs the claim URL to the server console instead of
 * dispatching real email, same rationale as the magic-link pair above.
 */
let lastInviteUrl: string | null = null;

export function logInviteLinkToConsole({
  invitedEmail,
  url,
}: {
  invitedEmail: string;
  url: string;
}) {
  lastInviteUrl = url;
  console.log(`\n[dev-mail] League invite link for ${invitedEmail}:\n${url}\n`);
}

/** Lets a dev-only UI surface the most recent invite link directly, no inbox required. */
export function getLastDevInviteUrl(): string | null {
  return lastInviteUrl;
}
