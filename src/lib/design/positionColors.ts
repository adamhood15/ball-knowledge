export interface PositionColorClasses {
  background: string;
  text: string;
  border: string;
}

const POSITION_COLORS: Record<string, PositionColorClasses> = {
  QB: { background: "bg-red-500/15", text: "text-red-400", border: "border-red-500/40" },
  RB: { background: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/40" },
  WR: { background: "bg-green-500/15", text: "text-green-400", border: "border-green-500/40" },
  TE: { background: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/40" },
  K: { background: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/40" },
  DEF: { background: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/40" },
};

const DEFAULT_COLOR_CLASSES: PositionColorClasses = {
  background: "bg-card-border/10",
  text: "text-muted-text",
  border: "border-card-border/30",
};

export function getPositionColorClasses(position: string | null): PositionColorClasses {
  if (!position) return DEFAULT_COLOR_CLASSES;
  return POSITION_COLORS[position] ?? DEFAULT_COLOR_CLASSES;
}
