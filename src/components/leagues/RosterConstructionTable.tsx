const BENCH_SLOT_KEY = "BENCH";

function sortSlotKeys(slotKeys: string[]): string[] {
  return [...slotKeys].sort((a, b) => {
    if (a === BENCH_SLOT_KEY) return 1;
    if (b === BENCH_SLOT_KEY) return -1;
    return a.localeCompare(b);
  });
}

export function RosterConstructionTable({ rosterConstruction }: { rosterConstruction: Record<string, number> }) {
  return (
    <table className="w-full text-sm text-body-text">
      <tbody>
        {sortSlotKeys(Object.keys(rosterConstruction)).map((slotKey) => (
          <tr key={slotKey} className="border-b border-card-border/10">
            <td className="py-1">{slotKey}</td>
            <td className="py-1 text-right">{rosterConstruction[slotKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
