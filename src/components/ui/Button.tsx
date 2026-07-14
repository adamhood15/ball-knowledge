import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary: "bg-card-border text-background hover:shadow-[0_0_16px_var(--color-card-border)]",
  secondary: "border border-card-border/60 text-body-text hover:border-card-border",
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
        "rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
