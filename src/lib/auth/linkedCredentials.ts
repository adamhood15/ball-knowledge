import type { PrismaClient } from "@/generated/prisma/client";
import type { LeaguePlatform } from "@/generated/prisma/enums";

export type LinkedCredentialOutcome =
  | { status: "linked" }
  | { status: "conflict"; linkedToUserId: string };

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION_CODE = "P2002";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION_CODE
  );
}

/**
 * Claims an external platform identity (e.g. a Sleeper user id) for the given account, or
 * reports that a *different* account already holds it. A (platform, externalId) pair can only
 * ever belong to one User — enforced by the database's own unique constraint, not just this
 * check, so two app accounts can never both end up linked to the same Sleeper username even
 * under a race between two simultaneous requests.
 */
export async function linkPlatformAccountOrDetectConflict({
  prisma,
  platform,
  externalId,
  userId,
}: {
  prisma: Pick<PrismaClient, "linkedCredential">;
  platform: LeaguePlatform;
  externalId: string;
  userId: string;
}): Promise<LinkedCredentialOutcome> {
  const existingLink = await prisma.linkedCredential.findUnique({
    where: { platform_externalId: { platform, externalId } },
  });
  if (existingLink) {
    return existingLink.userId === userId
      ? { status: "linked" }
      : { status: "conflict", linkedToUserId: existingLink.userId };
  }

  try {
    await prisma.linkedCredential.create({ data: { platform, externalId, userId } });
    return { status: "linked" };
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;

    // Another request claimed this identity between our check and our create. Re-read to find
    // out who actually won the race rather than assuming it was us.
    const raceWinner = await prisma.linkedCredential.findUnique({
      where: { platform_externalId: { platform, externalId } },
    });
    return raceWinner && raceWinner.userId !== userId
      ? { status: "conflict", linkedToUserId: raceWinner.userId }
      : { status: "linked" };
  }
}
