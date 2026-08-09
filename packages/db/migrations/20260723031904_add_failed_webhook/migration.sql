-- CreateTable
CREATE TABLE "FailedWebhook" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT,
    "rawBody" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedWebhook_provider_idx" ON "FailedWebhook"("provider");

-- CreateIndex
CREATE INDEX "FailedWebhook_resolvedAt_idx" ON "FailedWebhook"("resolvedAt");
