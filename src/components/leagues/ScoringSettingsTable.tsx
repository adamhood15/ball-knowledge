import {
  groupAndLabelScoringSettings,
  type ScoringStatCategory,
} from "@/lib/providers/league/sleeper/scoringStatLabels";

const CATEGORY_HEADINGS: Record<ScoringStatCategory, string> = {
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  defense: "Defense",
  specialTeams: "Special Teams",
  other: "Other",
};

// Sleeper's raw point values sometimes carry floating-point noise (e.g. 0.03999999910593033
// for a quarter-cent-per-yard rule), so round for display rather than showing that artifact.
function roundToNearestHundredth(points: number): number {
  return Math.round(points * 100) / 100;
}

export function ScoringSettingsTable({ scoringSettings }: { scoringSettings: Record<string, number> }) {
  const groups = groupAndLabelScoringSettings(scoringSettings);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <h3 className="font-display text-base text-body-text">{CATEGORY_HEADINGS[group.category]}</h3>
          <table className="w-full text-sm text-body-text">
            <tbody>
              {group.stats.map((stat) => (
                <tr key={stat.statKey} className="border-b border-card-border/10">
                  <td className="py-1">{stat.label}</td>
                  <td className="py-1 text-right">{roundToNearestHundredth(stat.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
