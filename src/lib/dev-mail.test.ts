import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getLastDevInviteUrl, getLastDevMagicLinkUrl, logInviteLinkToConsole, logMagicLinkToConsole } from "@/lib/dev-mail";

describe("logMagicLinkToConsole / getLastDevMagicLinkUrl", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null before any magic link has been logged", () => {
    expect(getLastDevMagicLinkUrl()).toBeNull();
  });

  it("remembers the most recently logged magic link so a dev UI can surface it", () => {
    logMagicLinkToConsole({ identifier: "a@example.com", url: "http://localhost:3000/api/auth/callback/nodemailer?token=abc" });

    expect(getLastDevMagicLinkUrl()).toBe("http://localhost:3000/api/auth/callback/nodemailer?token=abc");

    logMagicLinkToConsole({ identifier: "b@example.com", url: "http://localhost:3000/api/auth/callback/nodemailer?token=xyz" });

    expect(getLastDevMagicLinkUrl()).toBe("http://localhost:3000/api/auth/callback/nodemailer?token=xyz");
  });
});

describe("logInviteLinkToConsole / getLastDevInviteUrl", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("remembers the most recently logged league-invite link so a dev UI can surface it", () => {
    logInviteLinkToConsole({ invitedEmail: "a@example.com", url: "http://localhost:3000/invites/abc" });

    expect(getLastDevInviteUrl()).toBe("http://localhost:3000/invites/abc");

    logInviteLinkToConsole({ invitedEmail: "b@example.com", url: "http://localhost:3000/invites/xyz" });

    expect(getLastDevInviteUrl()).toBe("http://localhost:3000/invites/xyz");
  });
});
