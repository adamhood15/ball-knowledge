import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamCard } from "@/components/leagues/TeamCard";

describe("TeamCard", () => {
  it("shows the team's avatar image and name in grid variant", () => {
    render(<TeamCard teamName="Alice's Aces" avatarUrl="https://sleepercdn.com/avatars/abc" variant="grid" />);

    expect(screen.getByText("Alice's Aces")).toBeInTheDocument();
    expect(screen.getByTestId("team-avatar")).toHaveAttribute("src", "https://sleepercdn.com/avatars/abc");
  });

  it("shows a placeholder instead of a broken image when there is no avatar URL", () => {
    render(<TeamCard teamName="Team X" avatarUrl={null} variant="grid" />);

    expect(screen.queryByTestId("team-avatar")).not.toBeInTheDocument();
    expect(screen.getByText("Team X")).toBeInTheDocument();
  });

  it("renders a compact row variant for the League tab's team strip", () => {
    render(<TeamCard teamName="Bob's Team" avatarUrl={null} variant="row" />);

    expect(screen.getByText("Bob's Team")).toBeInTheDocument();
  });
});
