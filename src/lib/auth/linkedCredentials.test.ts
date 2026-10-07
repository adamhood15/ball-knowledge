import { describe, expect, it } from "vitest";
import { linkPlatformAccountOrDetectConflict } from "@/lib/auth/linkedCredentials";

interface FakeLinkedCredentialRow {
  platform: string;
  externalId: string;
  userId: string;
}

function fakePrisma(seedRows: FakeLinkedCredentialRow[] = []) {
  const rows = [...seedRows];
  const createCalls: FakeLinkedCredentialRow[] = [];

  return {
    rows,
    createCalls,
    linkedCredential: {
      async findUnique({ where }: { where: { platform_externalId: { platform: string; externalId: string } } }) {
        const { platform, externalId } = where.platform_externalId;
        return rows.find((row) => row.platform === platform && row.externalId === externalId) ?? null;
      },
      async create({ data }: { data: FakeLinkedCredentialRow }) {
        // Mirror the real unique constraint on (platform, externalId).
        const alreadyExists = rows.some(
          (row) => row.platform === data.platform && row.externalId === data.externalId,
        );
        if (alreadyExists) {
          const uniqueConstraintError = new Error("Unique constraint failed") as Error & { code: string };
          uniqueConstraintError.code = "P2002";
          throw uniqueConstraintError;
        }
        rows.push(data);
        createCalls.push(data);
        return data;
      },
    },
  };
}

describe("linkPlatformAccountOrDetectConflict", () => {
  it("claims a brand-new external identity for the requesting account", async () => {
    const prisma = fakePrisma();

    const outcome = await linkPlatformAccountOrDetectConflict({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      platform: "SLEEPER",
      externalId: "sleeper-user-1",
      userId: "account-a",
    });

    expect(outcome).toEqual({ status: "linked" });
    expect(prisma.createCalls).toEqual([{ platform: "SLEEPER", externalId: "sleeper-user-1", userId: "account-a" }]);
  });

  it("treats re-linking the same account to the same identity as success, not a conflict", async () => {
    const prisma = fakePrisma([{ platform: "SLEEPER", externalId: "sleeper-user-1", userId: "account-a" }]);

    const outcome = await linkPlatformAccountOrDetectConflict({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      platform: "SLEEPER",
      externalId: "sleeper-user-1",
      userId: "account-a",
    });

    expect(outcome).toEqual({ status: "linked" });
    expect(prisma.createCalls).toHaveLength(0);
  });

  it("reports a conflict, and never creates a second link, when a different account already owns the identity", async () => {
    const prisma = fakePrisma([{ platform: "SLEEPER", externalId: "sleeper-user-1", userId: "account-a" }]);

    const outcome = await linkPlatformAccountOrDetectConflict({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      platform: "SLEEPER",
      externalId: "sleeper-user-1",
      userId: "account-b",
    });

    expect(outcome).toEqual({ status: "conflict", linkedToUserId: "account-a" });
    expect(prisma.createCalls).toHaveLength(0);
  });

  it("resolves a race (two accounts linking the same brand-new identity at once) as a conflict for the loser, without throwing", async () => {
    // Simulates: our own findUnique saw nothing, but another request's create won the race
    // before ours ran — the real unique constraint is what actually prevents the duplicate.
    const prisma = fakePrisma();
    const realCreate = prisma.linkedCredential.create.bind(prisma.linkedCredential);
    prisma.linkedCredential.create = async (args: { data: FakeLinkedCredentialRow }) => {
      prisma.rows.push({ platform: "SLEEPER", externalId: "sleeper-user-1", userId: "account-a" });
      return realCreate(args);
    };

    const outcome = await linkPlatformAccountOrDetectConflict({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      platform: "SLEEPER",
      externalId: "sleeper-user-1",
      userId: "account-b",
    });

    expect(outcome).toEqual({ status: "conflict", linkedToUserId: "account-a" });
  });
});
