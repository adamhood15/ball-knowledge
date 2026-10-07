import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { LeaguePlatformIcon } from "@/components/leagues/LeaguePlatformIcon";

describe("LeaguePlatformIcon", () => {
  it("shows the Sleeper icon for a SLEEPER league", () => {
    render(<LeaguePlatformIcon platform="SLEEPER" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows a distinct icon for a SLEEPER league vs a MANUAL league", () => {
    const { container: sleeperContainer } = render(<LeaguePlatformIcon platform="SLEEPER" />);
    const { container: manualContainer } = render(<LeaguePlatformIcon platform="MANUAL" />);

    expect(sleeperContainer.querySelector("svg")?.innerHTML).not.toBe(
      manualContainer.querySelector("svg")?.innerHTML,
    );
  });
});
