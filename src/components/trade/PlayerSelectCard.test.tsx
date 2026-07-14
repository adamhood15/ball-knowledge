import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerSelectCard } from "@/components/trade/PlayerSelectCard";

describe("PlayerSelectCard", () => {
  it("shows the player's name, position, and NFL team abbreviation", () => {
    render(
      <PlayerSelectCard playerName="Jayden Daniels" position="QB" nflTeam="WAS" isSelected={false} onToggle={vi.fn()} />,
    );

    expect(screen.getByText("Jayden Daniels")).toBeInTheDocument();
    expect(screen.getByText("QB")).toBeInTheDocument();
    expect(screen.getByText("WAS")).toBeInTheDocument();
  });

  it("behaves like a checkbox: reflects selected state and toggles on click", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <PlayerSelectCard playerName="Jayden Daniels" position="QB" nflTeam="WAS" isSelected={false} onToggle={onToggle} />,
    );

    const card = screen.getByRole("checkbox");
    expect(card).toHaveAttribute("aria-checked", "false");

    await user.click(card);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("reflects a checked state when selected", () => {
    render(
      <PlayerSelectCard playerName="Jayden Daniels" position="QB" nflTeam="WAS" isSelected onToggle={vi.fn()} />,
    );

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });
});
