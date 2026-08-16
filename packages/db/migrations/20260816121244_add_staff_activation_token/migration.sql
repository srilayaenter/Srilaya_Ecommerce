-- CreateTable
CREATE TABLE "StaffActivationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffActivationToken_tokenHash_key" ON "StaffActivationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffActivationToken_userId_idx" ON "StaffActivationToken"("userId");

-- AddForeignKey
ALTER TABLE "StaffActivationToken" ADD CONSTRAINT "StaffActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
