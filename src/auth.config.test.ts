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
});
