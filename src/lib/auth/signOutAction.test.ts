import { describe, expect, it, vi, beforeEach } from "vitest";

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ signOut: signOutMock }));

const { signOutAction } = await import("@/lib/auth/signOutAction");

describe("signOutAction", () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it("signs the user out and redirects to sign-in", async () => {
    await signOutAction();

    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });
});
