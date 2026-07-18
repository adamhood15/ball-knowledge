import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeagueModeBadge } from "@/components/leagues/LeagueModeBadge";

describe("LeagueModeBadge", () => {
  it("shows 'Dynasty' for a dynasty league", () => {
    render(<LeagueModeBadge mode="DYNASTY" />);

    expect(screen.getByText("Dynasty")).toBeInTheDocument();
  });

  it("shows 'Redraft' for a redraft league", () => {
    render(<LeagueModeBadge mode="REDRAFT" />);

    expect(screen.getByText("Redraft")).toBeInTheDocument();
  });
});
