import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

const backMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: backMock }) }));
vi.mock("@/lib/auth/signOutAction", () => ({ signOutAction: vi.fn() }));

const { AppHeader } = await import("@/components/layout/AppHeader");

describe("AppHeader", () => {
  it("renders the header when a user is signed in", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await AppHeader();
    render(result ?? <></>);

    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("renders nothing when signed out", async () => {
    authMock.mockResolvedValue(null);

    const result = await AppHeader();

    expect(result).toBeNull();
  });
});
