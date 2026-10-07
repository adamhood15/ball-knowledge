-- CreateTable
CREATE TABLE "LinkedCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "LeaguePlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "encryptedCookie" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedCredential_userId_idx" ON "LinkedCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedCredential_platform_externalId_key" ON "LinkedCredential"("platform", "externalId");

-- AddForeignKey
ALTER TABLE "LinkedCredential" ADD CONSTRAINT "LinkedCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
