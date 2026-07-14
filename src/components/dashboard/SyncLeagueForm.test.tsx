import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncLeagueForm } from "@/components/dashboard/SyncLeagueForm";

const syncSleeperLeagueActionMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/dashboard/actions", () => ({
  syncSleeperLeagueAction: syncSleeperLeagueActionMock,
}));

describe("SyncLeagueForm", () => {
  it("lets a user submit a Sleeper league ID to sync", async () => {
    syncSleeperLeagueActionMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    const input = screen.getByLabelText(/sleeper league id/i);
    await user.type(input, "1347028745252257792");
    await user.click(screen.getByRole("button", { name: /sync league/i }));

    expect(syncSleeperLeagueActionMock).toHaveBeenCalled();
    const submittedFormData = syncSleeperLeagueActionMock.mock.calls[0]![1] as FormData;
    expect(submittedFormData.get("sleeperLeagueId")).toBe("1347028745252257792");
  });

  it("shows the action's error message when the sync fails", async () => {
    syncSleeperLeagueActionMock.mockResolvedValue({ error: "Couldn't sync that league." });
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper league id/i), "bad-id");
    await user.click(screen.getByRole("button", { name: /sync league/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't sync that league/i);
  });

  it("replaces the form with a loading indicator while the sync is pending", async () => {
    let resolveAction!: (value: { error: string | null }) => void;
    syncSleeperLeagueActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<SyncLeagueForm />);

    await user.type(screen.getByLabelText(/sleeper league id/i), "1347028745252257792");
    await user.click(screen.getByRole("button", { name: /sync league/i }));

    expect(await screen.findByText(/syncing/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sleeper league id/i)).not.toBeInTheDocument();

    resolveAction({ error: null });
  });
});
