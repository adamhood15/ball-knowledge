import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

const usePathnameMock = vi.hoisted(() => vi.fn(() => "/dashboard"));
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));

const { BottomNav } = await import("@/components/layout/BottomNav");

describe("BottomNav", () => {
  it("renders the nav when a user is signed in", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await BottomNav();
    render(result ?? <></>);

    expect(screen.getByTestId("nav-leagues")).toBeInTheDocument();
    expect(screen.getByTestId("nav-trade")).toBeInTheDocument();
    expect(screen.getByTestId("nav-account")).toBeInTheDocument();
  });

  it("renders nothing when signed out", async () => {
    authMock.mockResolvedValue(null);

    const result = await BottomNav();

    expect(result).toBeNull();
  });
});
