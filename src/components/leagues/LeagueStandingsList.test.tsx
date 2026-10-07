import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeagueStandingsList } from "@/components/leagues/LeagueStandingsList";

const team = (overrides: Partial<Parameters<typeof LeagueStandingsList>[0]["teams"][number]>) => ({
  teamId: "1",
  teamName: "Team",
  avatarUrl: null,
  wins: 0,
  losses: 0,
  ties: 0,
  pointsFor: 0,
  pointsAgainst: 0,
  waiverPosition: null,
  isClaimed: true,
  pendingInviteEmail: null,
  ...overrides,
});

describe("LeagueStandingsList", () => {
  it("labels the rank column 'Rank', not '#'", () => {
    render(<LeagueStandingsList leagueId="league-1" teams={[team({})]} />);

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.queryByText("#")).not.toBeInTheDocument();
  });

  it("ranks by waiver position when present, overriding what win percentage alone would say", () => {
    render(
      <LeagueStandingsList
        leagueId="league-1"
        teams={[
          // Most wins of the three, but the lowest waiver position (1) — highest waiver
          // priority — must still rank LAST, contradicting a win-percentage-only sort.
          team({ teamId: "1", teamName: "Most Wins", wins: 10, losses: 2, pointsFor: 2000, waiverPosition: 1 }),
          // Fewest wins, but the highest waiver position — lowest waiver priority — ranks FIRST.
          team({ teamId: "2", teamName: "Fewest Wins", wins: 2, losses: 10, pointsFor: 500, waiverPosition: 12 }),
          team({ teamId: "3", teamName: "Middle", wins: 6, losses: 6, pointsFor: 1000, waiverPosition: 6 }),
        ]}
      />,
    );

    const rows = screen.getAllByTestId("standings-row");
    expect(rows.map((row) => row.dataset.teamId)).toEqual(["2", "3", "1"]);
  });

  it("falls back to win percentage when waiver position isn't available (e.g. a manually-entered league)", () => {
    render(
      <LeagueStandingsList
        leagueId="league-1"
        teams={[
          // 8 wins / 14 games = .571, but has MORE points for than team 2
          team({ teamId: "1", teamName: "More Losses", wins: 8, losses: 6, ties: 0, pointsFor: 2000 }),
          // 8.5 "wins" / 14 games = .607 — better record despite fewer raw wins-only points
          team({ teamId: "2", teamName: "Has A Tie", wins: 8, losses: 5, ties: 1, pointsFor: 1000 }),
        ]}
      />,
    );

    const rows = screen.getAllByTestId("standings-row");
    expect(rows.map((row) => row.dataset.teamId)).toEqual(["2", "1"]);
  });

  it("breaks a genuine win-percentage tie by points for, descending", () => {
    render(
      <LeagueStandingsList
        leagueId="league-1"
        teams={[
          team({ teamId: "1", teamName: "Lower Scorer", wins: 5, losses: 5, pointsFor: 800 }),
          team({ teamId: "2", teamName: "Higher Scorer", wins: 5, losses: 5, pointsFor: 950 }),
        ]}
      />,
    );

    const rows = screen.getAllByTestId("standings-row");
    expect(rows.map((row) => row.dataset.teamId)).toEqual(["2", "1"]);
  });

  it("shows rank, avatar, name, record, PF, and PA together in one row, linking to that team's roster", () => {
    render(
      <LeagueStandingsList
        leagueId="league-1"
        teams={[team({ teamId: "1", teamName: "The Dynasty", wins: 8, losses: 5, ties: 1, pointsFor: 1245.67, pointsAgainst: 1180.32 })]}
      />,
    );

    const row = screen.getByTestId("standings-row");
    expect(row.tagName).toBe("A");
    expect(row).toHaveAttribute("href", "/leagues/league-1/teams/1");
    expect(row).toHaveTextContent("1");
    expect(row).toHaveTextContent("The Dynasty");
    expect(row).toHaveTextContent("8-5-1");
    expect(row).toHaveTextContent("1245.67");
    expect(row).toHaveTextContent("1180.32");
  });

  it("formats a zero points value as '0', not '0.00'", () => {
    render(<LeagueStandingsList leagueId="league-1" teams={[team({ pointsFor: 0, pointsAgainst: 0 })]} />);

    const row = screen.getByTestId("standings-row");
    expect(row).not.toHaveTextContent("0.00");
    expect(row).toHaveTextContent("0");
  });

  it("formats a whole-number points value without trailing decimals", () => {
    render(<LeagueStandingsList leagueId="league-1" teams={[team({ pointsFor: 1200, pointsAgainst: 950 })]} />);

    const row = screen.getByTestId("standings-row");
    expect(row).not.toHaveTextContent("1200.00");
    expect(row).toHaveTextContent("1200");
  });

  describe("invite management", () => {
    it("does not show an invite affordance when the viewer can't manage invites", () => {
      render(
        <LeagueStandingsList
          leagueId="league-1"
          teams={[team({ isClaimed: false })]}
          canManageInvites={false}
          sendInviteAction={vi.fn()}
        />,
      );

      expect(screen.queryByText(/invite someone/i)).not.toBeInTheDocument();
    });

    it("does not show an invite affordance for an already-claimed team", () => {
      render(
        <LeagueStandingsList
          leagueId="league-1"
          teams={[team({ isClaimed: true })]}
          canManageInvites
          sendInviteAction={vi.fn()}
        />,
      );

      expect(screen.queryByText(/invite someone/i)).not.toBeInTheDocument();
    });

    it("shows an invite affordance for an unclaimed team when the commissioner is viewing", () => {
      render(
        <LeagueStandingsList
          leagueId="league-1"
          teams={[team({ isClaimed: false })]}
          canManageInvites
          sendInviteAction={vi.fn()}
        />,
      );

      expect(screen.getByText(/invite someone/i)).toBeInTheDocument();
    });

    it("shows the pending invite's email instead of the invite prompt once one has been sent", () => {
      render(
        <LeagueStandingsList
          leagueId="league-1"
          teams={[team({ isClaimed: false, pendingInviteEmail: "teammate@example.com" })]}
          canManageInvites
          sendInviteAction={vi.fn()}
        />,
      );

      expect(screen.getByText(/teammate@example.com/i)).toBeInTheDocument();
      expect(screen.queryByText(/invite someone/i)).not.toBeInTheDocument();
    });

    it("sends the invite with the entered email when the form is submitted", async () => {
      const sendInviteActionMock = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(
        <LeagueStandingsList
          leagueId="league-1"
          teams={[team({ teamId: "42", isClaimed: false })]}
          canManageInvites
          sendInviteAction={sendInviteActionMock}
        />,
      );

      await user.click(screen.getByText(/invite someone/i));
      await user.type(screen.getByPlaceholderText(/teammate@example.com/i), "friend@example.com");
      await user.click(screen.getByRole("button", { name: /send/i }));

      expect(sendInviteActionMock).toHaveBeenCalledWith("42", "friend@example.com");
    });
  });
});
