import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppHeader } from "@/components/layout/AppHeader";

describe("AppHeader", () => {
  it("renders the app wordmark", () => {
    render(<AppHeader />);
    expect(screen.getByRole("heading", { name: /ball knowledge/i })).toBeInTheDocument();
  });
});
