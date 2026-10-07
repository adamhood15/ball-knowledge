import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-orange-accent text-background border-2 border-gold-accent shadow-[4px_4px_0_0_var(--color-gold-accent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-gold-accent)]",
  secondary:
    "bg-background text-body-text border-2 border-secondary-accent shadow-[4px_4px_0_0_var(--color-secondary-accent)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-secondary-accent)]",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT_CLASSES }) {
  return (
    <button
      type="button"
      {...buttonProps}
      className={[
        "rounded-none px-4 py-2 text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
