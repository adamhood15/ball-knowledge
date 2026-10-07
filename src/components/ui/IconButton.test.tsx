import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "@/components/ui/IconButton";

describe("IconButton", () => {
  it("renders its children and calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<IconButton onClick={onClick} aria-label="Remove">×</IconButton>);

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has hard, square corners and a quiet neutral outline at rest", () => {
    render(<IconButton aria-label="Remove">×</IconButton>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("rounded-none");
    expect(button).not.toHaveClass("rounded-full");
    expect(button).toHaveClass("border-muted-text/30");
  });

  it("does not fill its background on hover — only the border and shadow change", () => {
    render(<IconButton aria-label="Remove">×</IconButton>);
    const button = screen.getByRole("button");

    expect(button.className).not.toMatch(/hover:bg-/);
    expect(button).toHaveClass("hover:border-card-border");
    expect(button).toHaveClass("hover:shadow-[2px_2px_0_0_var(--color-card-border)]");
  });

  it("is disabled and unclickable when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <IconButton onClick={onClick} disabled aria-label="Remove">
        ×
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Remove" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
