import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayerHeadshot } from "@/components/leagues/PlayerHeadshot";

describe("PlayerHeadshot", () => {
  it("renders an image with the given src", () => {
    render(<PlayerHeadshot src="https://sleepercdn.com/content/nfl/players/thumb/4137.jpg" />);

    expect(screen.getByTestId("player-headshot-image")).toHaveAttribute(
      "src",
      "https://sleepercdn.com/content/nfl/players/thumb/4137.jpg",
    );
  });

  it("falls back to a placeholder box when the image fails to load", () => {
    render(<PlayerHeadshot src="https://sleepercdn.com/content/nfl/players/thumb/nonexistent.jpg" />);

    fireEvent.error(screen.getByTestId("player-headshot-image"));

    expect(screen.queryByTestId("player-headshot-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("player-headshot-placeholder")).toBeInTheDocument();
  });
});
