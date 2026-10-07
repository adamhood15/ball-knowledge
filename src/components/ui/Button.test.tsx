import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders its children and calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Sync league</Button>);

    await user.click(screen.getByRole("button", { name: "Sync league" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies primary variant styling by default: orange fill with a hard gold shadow", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-orange-accent");
    expect(button).toHaveClass("shadow-[4px_4px_0_0_var(--color-gold-accent)]");
  });

  it("applies secondary (outline) variant styling when requested: outline with a hard cyan shadow", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("bg-orange-accent");
    expect(button).toHaveClass("border-secondary-accent");
    expect(button).toHaveClass("shadow-[4px_4px_0_0_var(--color-secondary-accent)]");
  });

  it("has hard, square corners rather than rounded ones", () => {
    render(<Button>Square</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-none");
    expect(button).not.toHaveClass("rounded-md");
  });

  it("is disabled and unclickable when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
