-- CreateTable
CREATE TABLE "PackagingItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 50,
    "costPerUnit" DECIMAL(10,2),
    "supplierId" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingStockLog" (
    "id" TEXT NOT NULL,
    "packagingItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingStockLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackagingItem_name_key" ON "PackagingItem"("name");

-- CreateIndex
CREATE INDEX "PackagingItem_category_idx" ON "PackagingItem"("category");

-- CreateIndex
CREATE INDEX "PackagingItem_supplierId_idx" ON "PackagingItem"("supplierId");

-- CreateIndex
CREATE INDEX "PackagingStockLog_packagingItemId_idx" ON "PackagingStockLog"("packagingItemId");

-- CreateIndex
CREATE INDEX "PackagingStockLog_createdAt_idx" ON "PackagingStockLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PackagingItem" ADD CONSTRAINT "PackagingItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingStockLog" ADD CONSTRAINT "PackagingStockLog_packagingItemId_fkey" FOREIGN KEY ("packagingItemId") REFERENCES "PackagingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
