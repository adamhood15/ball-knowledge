-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "LeagueInvite" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "LeagueInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueInvite_token_key" ON "LeagueInvite"("token");

-- AddForeignKey
ALTER TABLE "LeagueInvite" ADD CONSTRAINT "LeagueInvite_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueInvite" ADD CONSTRAINT "LeagueInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
