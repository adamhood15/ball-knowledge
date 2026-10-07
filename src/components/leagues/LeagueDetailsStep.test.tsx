import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeagueDetailsStep } from "@/components/leagues/LeagueDetailsStep";

describe("LeagueDetailsStep", () => {
  it("defaults the team count to 12", () => {
    render(<LeagueDetailsStep onContinue={vi.fn()} />);

    expect(screen.getByLabelText(/number of teams/i)).toHaveValue("12");
  });

  it("disables Continue until a league name is entered", async () => {
    const user = userEvent.setup();
    render(<LeagueDetailsStep onContinue={vi.fn()} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/league name/i), "The Dynasty");

    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("passes the entered name and selected team count to onContinue", async () => {
    const onContinueMock = vi.fn();
    const user = userEvent.setup();
    render(<LeagueDetailsStep onContinue={onContinueMock} />);

    await user.type(screen.getByLabelText(/league name/i), "The Dynasty");
    await user.selectOptions(screen.getByLabelText(/number of teams/i), "10");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onContinueMock).toHaveBeenCalledWith({ name: "The Dynasty", teamCount: 10 });
  });
});
