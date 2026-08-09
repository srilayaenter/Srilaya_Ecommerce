import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
export * from '@prisma/client';

// Derives a variant's weight in grams from its size label (e.g. "500g" -> 500,
// "1kg" -> 1000, "2 kg" -> 2000). Returns null if the size string doesn't match
// a recognizable "<number><unit>" pattern, so callers can decide their own fallback.
// Duplicated in apps/web/lib/weight.ts (no shared workspace linkage between the
// two apps yet) -- keep both in sync if this logic ever changes.
export function deriveWeightGramsFromSize(size: string | null | undefined): number | null {
  if (!size) return null;
  const match = size.trim().toLowerCase().match(/^([\d.]+)\s*(kg|g|gram|grams|gm)?$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;
  const unit = match[2] || 'g';
  return unit === 'kg' ? Math.round(num * 1000) : Math.round(num);
}