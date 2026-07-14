import { getPositionColorClasses } from "@/lib/design/positionColors";

export function PlayerSelectCard({
  playerName,
  position,
  nflTeam,
  isSelected,
  onToggle,
}: {
  playerName: string;
  position: string | null;
  nflTeam: string | null;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const colors = getPositionColorClasses(position);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onToggle}
      className={[
        "flex flex-col gap-1 rounded-lg border p-3 text-left transition-all duration-150",
        colors.background,
        isSelected ? "border-card-border shadow-[0_0_12px_var(--color-card-border)]" : colors.border,
      ].join(" ")}
    >
      <span className={`text-xs font-semibold ${colors.text}`}>{position ?? "?"}</span>
      <span className="text-sm text-body-text">{playerName}</span>
      {nflTeam ? <span className="text-xs text-muted-text">{nflTeam}</span> : null}
    </button>
  );
}
