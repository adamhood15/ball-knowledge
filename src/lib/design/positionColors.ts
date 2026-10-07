export interface PositionColorClasses {
  background: string;
  text: string;
  border: string;
  /** Solid-fill + hard-shadow hover classes for the square icon-button pattern (e.g. roster +/- controls). */
  hoverAccent: string;
  /** Hard-shadow-only hover class (no background fill) for cards that keep their tinted background at rest, e.g. trade player cards. */
  hoverShadow: string;
}

// Hover classes are written out fully per position (not string-built) so Tailwind's
// static scanner can actually discover and generate them — a template-built class
// name like `hover:bg-${color}-500` is invisible to Tailwind at build time.
const POSITION_COLORS: Record<string, PositionColorClasses> = {
  QB: {
    background: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/40",
    hoverAccent: "hover:bg-red-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-red-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-red-500)]",
  },
  RB: {
    background: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/40",
    hoverAccent: "hover:bg-blue-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-blue-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-blue-500)]",
  },
  WR: {
    background: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/40",
    hoverAccent: "hover:bg-green-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-green-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-green-500)]",
  },
  TE: {
    background: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
    hoverAccent: "hover:bg-amber-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-amber-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-amber-500)]",
  },
  K: {
    background: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/40",
    hoverAccent: "hover:bg-purple-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-purple-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-purple-500)]",
  },
  DEF: {
    background: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/40",
    hoverAccent: "hover:bg-indigo-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-indigo-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-indigo-500)]",
  },
  FLEX: {
    background: "bg-teal-500/15",
    text: "text-teal-400",
    border: "border-teal-500/40",
    hoverAccent: "hover:bg-teal-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-teal-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-teal-500)]",
  },
  SUPERFLEX: {
    background: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/40",
    hoverAccent: "hover:bg-orange-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-orange-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-orange-500)]",
  },
  BENCH: {
    background: "bg-gray-500/15",
    text: "text-gray-400",
    border: "border-gray-500/40",
    hoverAccent: "hover:bg-gray-500 hover:text-background hover:shadow-[2px_2px_0_0_var(--color-gray-500)]",
    hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-gray-500)]",
  },
};

const DEFAULT_COLOR_CLASSES: PositionColorClasses = {
  background: "bg-card-border/10",
  text: "text-muted-text",
  border: "border-card-border/30",
  hoverAccent: "hover:bg-card-border hover:text-background hover:shadow-[2px_2px_0_0_var(--color-card-border)]",
  hoverShadow: "hover:shadow-[3px_3px_0_0_var(--color-card-border)]",
};

export function getPositionColorClasses(position: string | null): PositionColorClasses {
  if (!position) return DEFAULT_COLOR_CLASSES;
  return POSITION_COLORS[position] ?? DEFAULT_COLOR_CLASSES;
}
