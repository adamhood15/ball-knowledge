import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { sendLeagueInviteAction } = await import("@/app/leagues/[leagueId]/actions");
const { claimLeagueInviteAction } = await import("@/app/invites/actions");

describe("league invite lifecycle: commissioner sends, teammate claims (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const commissionerEmail = `${testRunId}-commissioner@example.com`;
  const teammateEmail = `${testRunId}-teammate@example.com`;
  let commissionerId: string;
  let teammateId: string;
  let leagueId: string;
  let teamId: string;

  beforeAll(async () => {
    const commissioner = await prisma.user.create({ data: { email: commissionerEmail } });
    commissionerId = commissioner.id;
    const teammate = await prisma.user.create({ data: { email: teammateEmail } });
    teammateId = teammate.id;

    const league = await prisma.league.create({
      data: {
        platform: "MANUAL",
        name: "Full Lifecycle Test League",
        createdByUserId: commissionerId,
      },
    });
    leagueId = league.id;
    const team = await prisma.team.create({ data: { leagueId, externalTeamId: "1", platformTeamName: "Team 2" } });
    teamId = team.id;
  });

  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterAll(async () => {
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.user.deleteMany({ where: { email: { in: [commissionerEmail, teammateEmail] } } });
    await prisma.$disconnect();
  });

  it("lets the commissioner send an invite, and the invited teammate claim it end-to-end", async () => {
    authMock.mockResolvedValue({ user: { id: commissionerId } });
    await sendLeagueInviteAction(leagueId, teamId, teammateEmail);

    const invite = await prisma.leagueInvite.findFirstOrThrow({ where: { teamId, invitedEmail: teammateEmail } });
    expect(invite.status).toBe("PENDING");

    authMock.mockResolvedValue({ user: { id: teammateId } });
    await claimLeagueInviteAction(invite.token);

    const claimedTeam = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    expect(claimedTeam.ownerId).toBe(teammateId);

    const updatedInvite = await prisma.leagueInvite.findUniqueOrThrow({ where: { id: invite.id } });
    expect(updatedInvite.status).toBe("CLAIMED");

    // A second person trying the same, now-claimed invite link should not be able to claim it too.
    const secondUser = await prisma.user.create({ data: { email: `${testRunId}-second@example.com` } });
    authMock.mockResolvedValue({ user: { id: secondUser.id } });
    await expect(claimLeagueInviteAction(invite.token)).rejects.toThrow();
    await prisma.user.delete({ where: { id: secondUser.id } });
  });
});
