-- Migration: add_variant_weight
-- Adds weightGrams to ProductVariant. Default 500 = 500g, safe for all existing variants.

ALTER TABLE "ProductVariant" ADD COLUMN "weightGrams" INTEGER NOT NULL DEFAULT 500;
