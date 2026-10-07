export function TradeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="3" y="7" width="12" height="3" />
      <polygon points="15,4 15,13 21,8.5" />
      <rect x="9" y="14" width="12" height="3" />
      <polygon points="9,12 9,21 3,16.5" />
    </svg>
  );
}
