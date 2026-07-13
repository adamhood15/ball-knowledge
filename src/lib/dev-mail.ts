/**
 * Dev-only magic-link "sender": logs the sign-in URL to the server console
 * instead of dispatching real email. Swap for a real SMTP/Resend transport
 * once the project has a transactional email provider (see AGENTS.md section 6).
 */
export function logMagicLinkToConsole({
  identifier,
  url,
}: {
  identifier: string;
  url: string;
}) {
  console.log(
    `\n[dev-mail] Magic sign-in link for ${identifier}:\n${url}\n`
  );
}
