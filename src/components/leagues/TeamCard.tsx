export function TeamCard({
  teamName,
  avatarUrl,
  variant = "grid",
  isSelected = false,
}: {
  teamName: string;
  avatarUrl: string | null;
  variant?: "grid" | "row";
  isSelected?: boolean;
}) {
  const isGrid = variant === "grid";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-none border-2 bg-background transition-all duration-150",
        isGrid ? "aspect-square w-full flex-col justify-center p-4 text-center" : "w-full px-3 py-2",
        isSelected
          ? "border-card-border shadow-[3px_3px_0_0_var(--color-card-border)]"
          : "border-muted-text/30 shadow-[2px_2px_0_0_var(--color-neutral-shadow)]",
        "hover:border-card-border hover:shadow-[3px_3px_0_0_var(--color-card-border)]",
      ].join(" ")}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative Sleeper avatar; see TeamCard.tsx test for why not next/image
        <img
          src={avatarUrl}
          alt=""
          data-testid="team-avatar"
          className={isGrid ? "h-16 w-16 rounded-full object-cover" : "h-8 w-8 rounded-full object-cover"}
        />
      ) : (
        <div
          className={
            isGrid
              ? "h-16 w-16 rounded-full bg-card-border/20"
              : "h-8 w-8 rounded-full bg-card-border/20"
          }
        />
      )}
      <span className="font-display text-sm text-body-text">{teamName}</span>
    </div>
  );
}
