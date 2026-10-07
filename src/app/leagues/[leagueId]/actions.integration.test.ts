import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { claimTeamAction, updateScoringSettingsAction, updateRosterConstructionAction, deleteLeagueAction, sendLeagueInviteAction } =
  await import("@/app/leagues/[leagueId]/actions");

describe("claimTeamAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerId: string;
  let otherUserId: string;
  let leagueId: string;
  let teamAId: string;
  let teamBId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;

    const league = await prisma.league.create({
      data: {
        platform: "SLEEPER",
        externalLeagueId: `claim-test-${testRunId}`,
        name: "Claim Test League",
        createdByUserId: commissionerId,
      },
    });
    leagueId = league.id;
    const teamA = await prisma.team.create({ data: { leagueId, externalTeamId: "a" } });
    const teamB = await prisma.team.create({ data: { leagueId, externalTeamId: "b" } });
    teamAId = teamA.id;
    teamBId = teamB.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { externalLeagueId: `claim-test-${testRunId}` } });
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await claimTeamAction(leagueId, teamAId);

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("claims the team for the signed-in commissioner", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await claimTeamAction(leagueId, teamAId);

    const teamA = await prisma.team.findUniqueOrThrow({ where: { id: teamAId } });
    expect(teamA.ownerId).toBe(commissionerId);
    expect(revalidatePathMock).toHaveBeenCalledWith(`/leagues/${leagueId}`);
  });

  it("re-claiming a different team releases the previous claim (one team per user per league)", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await claimTeamAction(leagueId, teamBId);

    const teamA = await prisma.team.findUniqueOrThrow({ where: { id: teamAId } });
    const teamB = await prisma.team.findUniqueOrThrow({ where: { id: teamBId } });
    expect(teamA.ownerId).toBeNull();
    expect(teamB.ownerId).toBe(commissionerId);
  });

  it("does not allow claiming a team in a league the user does not own", async () => {
    authMock.mockResolvedValue({ user: { id: otherUserId } });

    await expect(claimTeamAction(leagueId, teamAId)).rejects.toThrow();
  });
});

describe("updateScoringSettingsAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerId: string;
  let otherUserId: string;
  let leagueId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;

    const league = await prisma.league.create({
      data: {
        platform: "MANUAL",
        name: "Scoring Settings Test League",
        createdByUserId: commissionerId,
        scoringSettings: { rec: 0.5 },
      },
    });
    leagueId = league.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("saves the updated scoring settings for the commissioner", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await updateScoringSettingsAction(leagueId, { rec: 1, pass_td: 6 });

    const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
    expect(league.scoringSettings).toEqual({ rec: 1, pass_td: 6 });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/leagues/${leagueId}/settings`);
  });

  it("does not allow a non-commissioner to update scoring settings", async () => {
    authMock.mockResolvedValue({ user: { id: otherUserId } });

    await expect(updateScoringSettingsAction(leagueId, { rec: 0 })).rejects.toThrow();
  });
});

describe("updateRosterConstructionAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerId: string;
  let otherUserId: string;
  let leagueId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;

    const league = await prisma.league.create({
      data: {
        platform: "MANUAL",
        name: "Roster Construction Test League",
        createdByUserId: commissionerId,
        rosterConstruction: { QB: 1, BENCH: 6 },
      },
    });
    leagueId = league.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("saves an updated roster construction, e.g. a two-QB league, for the commissioner", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await updateRosterConstructionAction(leagueId, { QB: 2, BENCH: 6 });

    const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } });
    expect(league.rosterConstruction).toEqual({ QB: 2, BENCH: 6 });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/leagues/${leagueId}/settings`);
  });

  it("does not allow a non-commissioner to update roster construction", async () => {
    authMock.mockResolvedValue({ user: { id: otherUserId } });

    await expect(updateRosterConstructionAction(leagueId, { QB: 1 })).rejects.toThrow();
  });
});

describe("deleteLeagueAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerId: string;
  let otherUserId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await deleteLeagueAction("some-league-id");

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("deletes the league, its teams, and their rosters when the commissioner requests it", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });
    const league = await prisma.league.create({
      data: {
        platform: "MANUAL",
        name: "Delete Test League",
        createdByUserId: commissionerId,
      },
    });
    const team = await prisma.team.create({ data: { leagueId: league.id, externalTeamId: "1" } });
    await prisma.roster.create({ data: { teamId: team.id, players: [] } });

    await deleteLeagueAction(league.id);

    expect(await prisma.league.findUnique({ where: { id: league.id } })).toBeNull();
    expect(await prisma.team.findUnique({ where: { id: team.id } })).toBeNull();
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("does not allow deleting a league the user does not own", async () => {
    authMock.mockResolvedValue({ user: { id: otherUserId } });
    const league = await prisma.league.create({
      data: { platform: "MANUAL", name: "Not Yours", createdByUserId: commissionerId },
    });

    await expect(deleteLeagueAction(league.id)).rejects.toThrow();

    await prisma.league.delete({ where: { id: league.id } });
  });
});

describe("sendLeagueInviteAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const otherUserEmail = `${testRunId}-other@example.com`;
  let commissionerId: string;
  let otherUserId: string;
  let leagueId: string;
  let unclaimedTeamId: string;
  let claimedTeamId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const otherUser = await prisma.user.create({ data: { email: otherUserEmail } });
    otherUserId = otherUser.id;

    const league = await prisma.league.create({
      data: {
        platform: "MANUAL",
        name: "Invite Test League",
        createdByUserId: commissionerId,
      },
    });
    leagueId = league.id;
    const unclaimedTeam = await prisma.team.create({ data: { leagueId, externalTeamId: "1" } });
    unclaimedTeamId = unclaimedTeam.id;
    const claimedTeam = await prisma.team.create({
      data: { leagueId, externalTeamId: "2", ownerId: commissionerId },
    });
    claimedTeamId = claimedTeam.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, otherUserEmail] } } });
    await prisma.$disconnect();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await sendLeagueInviteAction(leagueId, unclaimedTeamId, "teammate@example.com");

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("does not allow a non-commissioner to send an invite", async () => {
    authMock.mockResolvedValue({ user: { id: otherUserId } });

    await expect(sendLeagueInviteAction(leagueId, unclaimedTeamId, "teammate@example.com")).rejects.toThrow();
  });

  it("creates a pending invite for an unclaimed team and revalidates the teams page", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await sendLeagueInviteAction(leagueId, unclaimedTeamId, "teammate@example.com");

    const invite = await prisma.leagueInvite.findFirstOrThrow({ where: { teamId: unclaimedTeamId } });
    expect(invite.invitedEmail).toBe("teammate@example.com");
    expect(invite.status).toBe("PENDING");
    expect(invite.token).toBeTruthy();
    expect(revalidatePathMock).toHaveBeenCalledWith(`/leagues/${leagueId}/teams`);
  });

  it("does not allow inviting for a team that's already claimed", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });

    await expect(sendLeagueInviteAction(leagueId, claimedTeamId, "teammate@example.com")).rejects.toThrow();
  });
});
