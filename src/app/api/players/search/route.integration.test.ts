import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { normalizePlayerName } from "@/lib/trade/normalizePlayerName";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

const { GET } = await import("@/app/api/players/search/route");

describe("GET /api/players/search (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const playerId = `${testRunId}-player`;

  beforeAll(async () => {
    await prisma.player.create({
      data: {
        canonicalId: playerId,
        name: `Search Route Test ${testRunId}`,
        normalizedName: normalizePlayerName(`Search Route Test ${testRunId}`),
        position: "WR",
        nflTeam: "SF",
      },
    });
  });

  beforeEach(() => {
    authMock.mockReset();
  });

  afterAll(async () => {
    await prisma.player.deleteMany({ where: { canonicalId: playerId } });
    await prisma.$disconnect();
  });

  it("returns 401 when there is no signed-in user", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(new Request(`http://localhost/api/players/search?q=${testRunId}`));

    expect(response.status).toBe(401);
  });

  it("returns matching players for a signed-in user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const response = await GET(new Request(`http://localhost/api/players/search?q=${testRunId}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.some((p: { canonicalPlayerId: string }) => p.canonicalPlayerId === playerId)).toBe(true);
  });
});
