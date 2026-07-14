export function ScoringSettingsTable({ scoringSettings }: { scoringSettings: Record<string, number> }) {
  const sortedStatCategories = Object.keys(scoringSettings).sort((a, b) => a.localeCompare(b));

  return (
    <table className="w-full text-sm text-body-text">
      <thead>
        <tr className="border-b border-card-border/30 text-left text-muted-text">
          <th className="py-2 font-normal">Stat</th>
          <th className="py-2 font-normal">Points</th>
        </tr>
      </thead>
      <tbody>
        {sortedStatCategories.map((statCategory) => (
          <tr key={statCategory} className="border-b border-card-border/10">
            <td className="py-1">{statCategory}</td>
            <td className="py-1">{scoringSettings[statCategory]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
