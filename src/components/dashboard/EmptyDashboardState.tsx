export function EmptyDashboardState() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-lg border border-card-border/30 bg-background p-10 text-center">
      <p className="text-lg text-body-text">No leagues linked yet</p>
      <p className="text-sm text-muted-text">
        Link a Sleeper or ESPN league to start evaluating trades. League sync is
        coming in the next phase of this build.
      </p>
    </div>
  );
}
