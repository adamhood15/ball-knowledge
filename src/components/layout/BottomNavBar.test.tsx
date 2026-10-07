import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const usePathnameMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));

const { BottomNavBar } = await import("@/components/layout/BottomNavBar");

describe("BottomNavBar", () => {
  it("links Leagues to the dashboard", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-leagues")).toHaveAttribute("href", "/dashboard");
  });

  it("highlights Leagues as active on the dashboard and on any league page", () => {
    usePathnameMock.mockReturnValue("/leagues/abc123");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-leagues")).toHaveClass("text-secondary-accent");
  });

  it("does not highlight Leagues as active elsewhere", () => {
    usePathnameMock.mockReturnValue("/trade/new");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-leagues")).not.toHaveClass("text-secondary-accent");
  });

  it("links the Trade button to the new trade entry page", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-trade")).toHaveAttribute("href", "/trade/new");
  });

  it("links Account to the account page", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-account")).toHaveAttribute("href", "/account");
  });

  it("highlights Account as active on the account page", () => {
    usePathnameMock.mockReturnValue("/account");

    render(<BottomNavBar />);

    expect(screen.getByTestId("nav-account")).toHaveClass("text-secondary-accent");
  });
});
