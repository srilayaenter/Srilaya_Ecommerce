-- CreateTable
CREATE TABLE "MfaTotpAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "succeeded" BOOLEAN NOT NULL,

    CONSTRAINT "MfaTotpAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MfaTotpAttempt_userId_attemptedAt_idx" ON "MfaTotpAttempt"("userId", "attemptedAt");

-- AddForeignKey
ALTER TABLE "MfaTotpAttempt" ADD CONSTRAINT "MfaTotpAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
