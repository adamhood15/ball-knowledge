import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";

describe("EmptyDashboardState", () => {
  it("tells a first-time user they have no leagues linked yet", () => {
    render(<EmptyDashboardState />);

    expect(screen.getByText(/no leagues.*yet/i)).toBeInTheDocument();
  });
});
