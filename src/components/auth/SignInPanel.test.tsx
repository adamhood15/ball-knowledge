import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInPanel } from "@/components/auth/SignInPanel";

describe("SignInPanel", () => {
  it("submits the Google sign-in action when the Google button is clicked", async () => {
    const onGoogleSignIn = vi.fn();
    render(<SignInPanel onGoogleSignIn={onGoogleSignIn} onEmailSignIn={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(onGoogleSignIn).toHaveBeenCalledTimes(1);
  });

  it("submits the entered email for a magic-link sign-in", async () => {
    const onEmailSignIn = vi.fn();
    render(<SignInPanel onGoogleSignIn={vi.fn()} onEmailSignIn={onEmailSignIn} />);

    await userEvent.type(screen.getByLabelText(/email/i), "manager@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send.*magic link/i }));

    expect(onEmailSignIn).toHaveBeenCalledTimes(1);
    const submittedFormData = onEmailSignIn.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("email")).toBe("manager@example.com");
  });
});
