import type { ButtonHTMLAttributes } from "react";

export function IconButton({ className = "", ...buttonProps }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...buttonProps}
      className={[
        "flex h-6 w-6 items-center justify-center rounded-none border border-muted-text/30 text-muted-text transition-all duration-150 hover:border-card-border hover:text-card-border hover:shadow-[2px_2px_0_0_var(--color-card-border)] disabled:pointer-events-none disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
