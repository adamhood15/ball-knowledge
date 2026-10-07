import Link from "next/link";
import { InviteTeamControl } from "@/components/leagues/InviteTeamControl";

export interface LeagueStandingsTeam {
  teamId: string;
  teamName: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Reverse-standings waiver queue position (1 = first priority, typically the worst team),
   * or null when the platform doesn't report one (e.g. a manually-entered league). */
  waiverPosition: number | null;
  isClaimed: boolean;
  /** The email of an outstanding, not-yet-accepted invite for this team, if any. */
  pendingInviteEmail: string | null;
}

const ROW_GRID_CLASSES = "grid grid-cols-[2rem_2.5rem_1fr_4.5rem_3.5rem_3.5rem] items-center gap-2";

// Whole numbers (including zero) show with no decimal places; anything else rounds to 2.
function formatPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

// A tie counts as half a win, matching how Sleeper (and fantasy standings generally) rank
// teams — comparing raw win counts alone misranks a team with a tie against one with none.
function winPercentage(team: LeagueStandingsTeam): number {
  const gamesPlayed = team.wins + team.losses + team.ties;
  if (gamesPlayed === 0) return 0;
  return (team.wins + team.ties * 0.5) / gamesPlayed;
}

// Sleeper (and reverse-standings waivers generally) assign the worst team the highest waiver
// priority — the lowest position number, e.g. 1 — and the best team the lowest priority, the
// highest position number. So a higher waiver position ranks first (better) here.
function sortByStandings(a: LeagueStandingsTeam, b: LeagueStandingsTeam): number {
  if (a.waiverPosition != null && b.waiverPosition != null) {
    return b.waiverPosition - a.waiverPosition;
  }
  const winPercentageDiff = winPercentage(b) - winPercentage(a);
  if (winPercentageDiff !== 0) return winPercentageDiff;
  return b.pointsFor - a.pointsFor;
}

export function LeagueStandingsList({
  leagueId,
  teams,
  canManageInvites = false,
  sendInviteAction,
}: {
  leagueId: string;
  teams: LeagueStandingsTeam[];
  canManageInvites?: boolean;
  sendInviteAction?: (teamId: string, invitedEmail: string) => Promise<void>;
}) {
  const rankedTeams = [...teams].sort(sortByStandings);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      <div className={`${ROW_GRID_CLASSES} px-3 text-xs uppercase tracking-wide text-muted-text`}>
        <span>Rank</span>
        <span />
        <span>Team</span>
        <span className="text-right">Record</span>
        <span className="text-right">PF</span>
        <span className="text-right">PA</span>
      </div>
      {rankedTeams.map((team, index) => (
        <div key={team.teamId} className="flex flex-col gap-1">
          <Link
            href={`/leagues/${leagueId}/teams/${team.teamId}`}
            data-testid="standings-row"
            data-team-id={team.teamId}
            className={`${ROW_GRID_CLASSES} rounded-none border-2 border-muted-text/30 bg-background px-3 py-2 shadow-[2px_2px_0_0_var(--color-neutral-shadow)] transition-all duration-150 hover:border-card-border hover:shadow-[3px_3px_0_0_var(--color-card-border)]`}
          >
            <span className="text-sm text-muted-text">{index + 1}</span>
            {team.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- decorative Sleeper avatar
              <img src={team.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-card-border/20" />
            )}
            <span className="truncate text-sm text-body-text">{team.teamName}</span>
            <span className="text-right text-sm text-body-text">
              {team.wins}-{team.losses}-{team.ties}
            </span>
            <span className="text-right text-xs text-muted-text">{formatPoints(team.pointsFor)}</span>
            <span className="text-right text-xs text-muted-text">{formatPoints(team.pointsAgainst)}</span>
          </Link>
          {canManageInvites && !team.isClaimed && sendInviteAction ? (
            <InviteTeamControl
              teamId={team.teamId}
              pendingInviteEmail={team.pendingInviteEmail}
              sendInviteAction={sendInviteAction}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
