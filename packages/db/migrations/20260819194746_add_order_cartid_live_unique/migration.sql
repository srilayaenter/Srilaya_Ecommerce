-- CreateIndex
CREATE UNIQUE INDEX "Order_cartId_live_unique"
  ON "Order" ("cartId")
  WHERE "status" IN ('pending', 'cod_pending') AND "cartId" IS NOT NULL;
