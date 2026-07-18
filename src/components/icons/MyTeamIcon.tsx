export function MyTeamIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="4" />
      <polygon points="9,7 3,9 3,13 7,13 7,21 17,21 17,13 21,13 21,9 15,7" />
    </svg>
  );
}
