-- Migration: add_shipment_tracking
-- Adds orderChannel and paymentMethod to Order, and creates the Shipment table.

-- 1. Add orderChannel column (default "online" so all existing orders are treated as online)
ALTER TABLE "Order" ADD COLUMN "orderChannel" TEXT NOT NULL DEFAULT 'online';

-- 2. Add paymentMethod column (nullable — existing orders keep NULL)
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;

-- 3. Create Shipment table
CREATE TABLE "Shipment" (
    "id"                TEXT NOT NULL,
    "orderId"           TEXT NOT NULL,
    "courier"           TEXT NOT NULL,
    "trackingNumber"    TEXT NOT NULL,
    "trackingUrl"       TEXT,
    "status"            TEXT NOT NULL DEFAULT 'booked',
    "shippedAt"         TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- 4. Unique constraint — one shipment per order
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- 5. Foreign key: Shipment → Order (cascade on delete)
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
