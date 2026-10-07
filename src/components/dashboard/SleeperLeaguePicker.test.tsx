import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SleeperLeaguePicker } from "@/components/dashboard/SleeperLeaguePicker";

const leagues = [
  { externalLeagueId: "111", name: "League A" },
  { externalLeagueId: "222", name: "League B" },
];

describe("SleeperLeaguePicker", () => {
  it("renders a card for each league", () => {
    render(<SleeperLeaguePicker leagues={leagues} onConfirm={vi.fn()} />);

    expect(screen.getByText("League A")).toBeInTheDocument();
    expect(screen.getByText("League B")).toBeInTheDocument();
  });

  it("disables Confirm until at least one league is selected", async () => {
    const user = userEvent.setup();
    render(<SleeperLeaguePicker leagues={leagues} onConfirm={vi.fn()} />);

    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();

    await user.click(screen.getByText("League A"));

    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
  });

  it("highlights a card when tapped, and un-highlights it when tapped again", async () => {
    const user = userEvent.setup();
    render(<SleeperLeaguePicker leagues={leagues} onConfirm={vi.fn()} />);

    const card = screen.getByTestId("sleeper-league-card-111");
    expect(card).toHaveAttribute("aria-checked", "false");

    await user.click(card);
    expect(card).toHaveAttribute("aria-checked", "true");

    await user.click(card);
    expect(card).toHaveAttribute("aria-checked", "false");
  });

  it("supports selecting multiple leagues at once", async () => {
    const onConfirmMock = vi.fn();
    const user = userEvent.setup();
    render(<SleeperLeaguePicker leagues={leagues} onConfirm={onConfirmMock} />);

    await user.click(screen.getByTestId("sleeper-league-card-111"));
    await user.click(screen.getByTestId("sleeper-league-card-222"));
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(expect.arrayContaining(["111", "222"]));
    expect(onConfirmMock.mock.calls[0]![0]).toHaveLength(2);
  });

  it("calls onConfirm with only the selected league ids", async () => {
    const onConfirmMock = vi.fn();
    const user = userEvent.setup();
    render(<SleeperLeaguePicker leagues={leagues} onConfirm={onConfirmMock} />);

    await user.click(screen.getByTestId("sleeper-league-card-111"));
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirmMock).toHaveBeenCalledWith(["111"]);
  });
});
