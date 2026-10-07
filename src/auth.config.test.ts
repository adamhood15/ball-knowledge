import { describe, expect, it } from "vitest";
import { authConfig } from "@/auth.config";

describe("authConfig", () => {
  it("configures Google OAuth and Nodemailer (magic link) providers", () => {
    const providerIds = authConfig.providers.map((provider) => provider.id);

    expect(providerIds).toContain("google");
    expect(providerIds).toContain("nodemailer");
  });

  it("routes sign-in through a custom page rather than the Auth.js default", () => {
    expect(authConfig.pages?.signIn).toBe("/sign-in");
  });

  // Regression test: without this, Auth.js rejects every request with
  // "UntrustedHost" whenever the app runs outside a platform it auto-trusts
  // (e.g. `next start` locally, or any self-hosted deployment) and no
  // NEXTAUTH_URL is set — see the auth-error page and AGENTS.md section 6.
  it("trusts the incoming request host so self-hosted/local production runs don't reject every auth request", () => {
    expect(authConfig.trustHost).toBe(true);
  });
});
