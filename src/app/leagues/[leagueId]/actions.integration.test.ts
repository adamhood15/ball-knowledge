import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { claimTeamAction } = await import("@/app/leagues/[leagueId]/actions");

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
