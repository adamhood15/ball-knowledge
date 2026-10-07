import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeaderBar } from "@/components/layout/AppHeaderBar";

const backMock = vi.hoisted(() => vi.fn());
const signOutActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock }),
}));
vi.mock("@/lib/auth/signOutAction", () => ({ signOutAction: signOutActionMock }));

describe("AppHeaderBar", () => {
  it("goes back in history when the back button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeaderBar />);

    await user.click(screen.getByRole("button", { name: /go back/i }));

    expect(backMock).toHaveBeenCalled();
  });

  it("submits the sign-out action when the log out button is clicked", async () => {
    signOutActionMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AppHeaderBar />);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(signOutActionMock).toHaveBeenCalled();
  });

  it("shows the app logo in the center of the header", () => {
    render(<AppHeaderBar />);

    expect(screen.getByAltText(/ball knowledge/i)).toBeInTheDocument();
  });
});
