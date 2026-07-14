export function EmptyDashboardState() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-lg border border-card-border/30 bg-background p-10 text-center">
      <p className="text-lg text-body-text">No leagues linked yet</p>
      <p className="text-sm text-muted-text">
        Paste your Sleeper league ID below to pull in rosters and scoring settings.
      </p>
    </div>
  );
}
