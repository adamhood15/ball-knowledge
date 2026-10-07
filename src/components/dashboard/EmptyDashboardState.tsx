export function EmptyDashboardState() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-none border-2 border-muted-text/30 bg-background p-10 text-center shadow-[4px_4px_0_0_var(--color-neutral-shadow)]">
      <p className="text-lg text-body-text">No leagues linked yet</p>
      <p className="text-sm text-muted-text">
        Enter your Sleeper username below to pull in rosters and scoring settings.
      </p>
    </div>
  );
}
