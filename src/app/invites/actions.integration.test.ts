import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { claimLeagueInviteAction } = await import("@/app/invites/actions");

describe("claimLeagueInviteAction (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const inviteeEmail = `${testRunId}-invitee@example.com`;
  const otherInviteeEmail = `${testRunId}-other-invitee@example.com`;
  let commissionerId: string;
  let inviteeId: string;
  let otherInviteeId: string;
  let leagueId: string;
  let teamAId: string;
  let teamBId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const invitee = await prisma.user.create({ data: { email: inviteeEmail } });
    inviteeId = invitee.id;
    const otherInvitee = await prisma.user.create({ data: { email: otherInviteeEmail } });
    otherInviteeId = otherInvitee.id;

    const league = await prisma.league.create({
      data: { platform: "MANUAL", name: "Claim Invite Test League", createdByUserId: commissionerId },
    });
    leagueId = league.id;
    const teamA = await prisma.team.create({ data: { leagueId, externalTeamId: "a" } });
    teamAId = teamA.id;
    const teamB = await prisma.team.create({ data: { leagueId, externalTeamId: "b" } });
    teamBId = teamB.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({
      where: { email: { in: [commissionerEmail, inviteeEmail, otherInviteeEmail] } },
    });
    await prisma.$disconnect();
  });

  it("redirects to sign-in when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    await claimLeagueInviteAction("some-token");

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("throws for a token that doesn't exist", async () => {
    authMock.mockResolvedValue({ user: { id: inviteeId } });

    await expect(claimLeagueInviteAction("not-a-real-token")).rejects.toThrow();
  });

  it("claims the invited team for the signed-in user and marks the invite claimed", async () => {
    const invite = await prisma.leagueInvite.create({
      data: { leagueId, teamId: teamAId, invitedEmail: inviteeEmail, token: `token-${testRunId}-a` },
    });
    authMock.mockResolvedValue({ user: { id: inviteeId } });

    await claimLeagueInviteAction(invite.token);

    const teamA = await prisma.team.findUniqueOrThrow({ where: { id: teamAId } });
    expect(teamA.ownerId).toBe(inviteeId);
    const updatedInvite = await prisma.leagueInvite.findUniqueOrThrow({ where: { id: invite.id } });
    expect(updatedInvite.status).toBe("CLAIMED");
    expect(updatedInvite.respondedAt).not.toBeNull();
    expect(redirectMock).toHaveBeenCalledWith(`/leagues/${leagueId}`);
  });

  it("releases a previous claim in the same league when claiming a different team", async () => {
    const invite = await prisma.leagueInvite.create({
      data: { leagueId, teamId: teamBId, invitedEmail: inviteeEmail, token: `token-${testRunId}-b` },
    });
    authMock.mockResolvedValue({ user: { id: inviteeId } });

    await claimLeagueInviteAction(invite.token);

    const teamA = await prisma.team.findUniqueOrThrow({ where: { id: teamAId } });
    const teamB = await prisma.team.findUniqueOrThrow({ where: { id: teamBId } });
    expect(teamA.ownerId).toBeNull();
    expect(teamB.ownerId).toBe(inviteeId);
  });

  it("does not allow re-claiming an already-claimed invite", async () => {
    const invite = await prisma.leagueInvite.create({
      data: {
        leagueId,
        teamId: teamAId,
        invitedEmail: inviteeEmail,
        token: `token-${testRunId}-c`,
        status: "CLAIMED",
        respondedAt: new Date(),
      },
    });
    authMock.mockResolvedValue({ user: { id: otherInviteeId } });

    await expect(claimLeagueInviteAction(invite.token)).rejects.toThrow();
  });
});
