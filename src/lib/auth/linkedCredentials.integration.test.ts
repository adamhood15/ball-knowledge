import { afterAll, describe, expect, it } from "vitest";
import { linkPlatformAccountOrDetectConflict } from "@/lib/auth/linkedCredentials";
import { prisma } from "@/lib/prisma";

describe("linkPlatformAccountOrDetectConflict (Prisma integration)", () => {
  const testRunId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const accountAEmail = `${testRunId}-a@example.com`;
  const accountBEmail = `${testRunId}-b@example.com`;
  const sharedSleeperExternalId = `sleeper-${testRunId}`;

  afterAll(async () => {
    await prisma.linkedCredential.deleteMany({ where: { externalId: sharedSleeperExternalId } });
    await prisma.user.deleteMany({ where: { email: { in: [accountAEmail, accountBEmail] } } });
    await prisma.$disconnect();
  });

  it("lets the first account claim a Sleeper identity, then refuses a second account the same identity", async () => {
    const accountA = await prisma.user.create({ data: { email: accountAEmail } });
    const accountB = await prisma.user.create({ data: { email: accountBEmail } });

    const firstOutcome = await linkPlatformAccountOrDetectConflict({
      prisma,
      platform: "SLEEPER",
      externalId: sharedSleeperExternalId,
      userId: accountA.id,
    });
    expect(firstOutcome).toEqual({ status: "linked" });

    const secondOutcome = await linkPlatformAccountOrDetectConflict({
      prisma,
      platform: "SLEEPER",
      externalId: sharedSleeperExternalId,
      userId: accountB.id,
    });
    expect(secondOutcome).toEqual({ status: "conflict", linkedToUserId: accountA.id });

    // Only one row should exist — account B's attempt must never have been persisted.
    const links = await prisma.linkedCredential.findMany({ where: { externalId: sharedSleeperExternalId } });
    expect(links).toHaveLength(1);
    expect(links[0]!.userId).toBe(accountA.id);
  });

  it("enforces one-account-per-identity at the database level, not just in application logic", async () => {
    const accountA = await prisma.user.create({ data: { email: `${accountAEmail}-db` } });
    const accountB = await prisma.user.create({ data: { email: `${accountBEmail}-db` } });
    const externalId = `${sharedSleeperExternalId}-db`;

    await prisma.linkedCredential.create({ data: { platform: "SLEEPER", externalId, userId: accountA.id } });

    await expect(
      prisma.linkedCredential.create({ data: { platform: "SLEEPER", externalId, userId: accountB.id } }),
    ).rejects.toMatchObject({ code: "P2002" });

    await prisma.linkedCredential.deleteMany({ where: { externalId } });
    await prisma.user.deleteMany({ where: { id: { in: [accountA.id, accountB.id] } } });
  });
});
