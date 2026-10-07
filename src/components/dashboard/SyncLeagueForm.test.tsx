import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncLeagueForm } from "@/components/dashboard/SyncLeagueForm";

const lookupSleeperLeaguesActionMock = vi.hoisted(() => vi.fn());
const syncSelectedSleeperLeaguesActionMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/dashboard/actions", () => ({
  lookupSleeperLeaguesAction: lookupSleeperLeaguesActionMock,
  syncSelectedSleeperLeaguesAction: syncSelectedSleeperLeaguesActionMock,
}));

describe("SyncLeagueForm", () => {
  it("lets a user submit their Sleeper username to look up leagues", async () => {
    lookupSleeperLeaguesActionMock.mockResolvedValue({ error: null, result: null });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    const input = screen.getByLabelText(/sleeper username/i);
    await user.type(input, "mahomes15");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));

    expect(lookupSleeperLeaguesActionMock).toHaveBeenCalled();
    const submittedFormData = lookupSleeperLeaguesActionMock.mock.calls[0]![1] as FormData;
    expect(submittedFormData.get("username")).toBe("mahomes15");
  });

  it("shows the action's error message when the username isn't found", async () => {
    lookupSleeperLeaguesActionMock.mockResolvedValue({ error: "Couldn't find that Sleeper username.", result: null });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper username/i), "nobody-real");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't find that sleeper username/i);
  });

  it("shows a loading indicator while the lookup is pending", async () => {
    let resolveAction!: (value: unknown) => void;
    lookupSleeperLeaguesActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper username/i), "mahomes15");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));

    expect(await screen.findByText(/looking/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sleeper username/i)).not.toBeInTheDocument();

    resolveAction({ error: null, result: null });
  });

  it("shows a league picker after a successful lookup with leagues", async () => {
    lookupSleeperLeaguesActionMock.mockResolvedValue({
      error: null,
      result: {
        sleeperUserId: "12345",
        sleeperUsername: "mahomes15",
        leagues: [{ externalLeagueId: "111", name: "League A" }],
      },
    });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper username/i), "mahomes15");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));

    expect(await screen.findByText("League A")).toBeInTheDocument();
  });

  it("shows a 'no leagues found' message when the lookup succeeds with zero leagues", async () => {
    lookupSleeperLeaguesActionMock.mockResolvedValue({
      error: null,
      result: { sleeperUserId: "12345", sleeperUsername: "mahomes15", leagues: [] },
    });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper username/i), "mahomes15");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));

    expect(await screen.findByText(/no leagues found/i)).toBeInTheDocument();
  });

  it("confirming selected leagues calls syncSelectedSleeperLeaguesAction with the sleeper user id and chosen league ids", async () => {
    lookupSleeperLeaguesActionMock.mockResolvedValue({
      error: null,
      result: {
        sleeperUserId: "12345",
        sleeperUsername: "mahomes15",
        leagues: [
          { externalLeagueId: "111", name: "League A" },
          { externalLeagueId: "222", name: "League B" },
        ],
      },
    });
    syncSelectedSleeperLeaguesActionMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper username/i), "mahomes15");
    await user.click(screen.getByRole("button", { name: /find leagues/i }));
    await screen.findByText("League A");

    await user.click(screen.getByTestId("sleeper-league-card-111"));
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(syncSelectedSleeperLeaguesActionMock).toHaveBeenCalledWith("12345", ["111"]);
  });
});
