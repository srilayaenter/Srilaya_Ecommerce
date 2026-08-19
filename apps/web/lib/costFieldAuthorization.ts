import { isOwner } from "./permissions";

// Decides whether a costPrice value should be persisted for a variant
// update, based on the SUBMITTING SESSION'S role — not just whether the
// form field was present in the request. A crafted request can include
// costPrice regardless of what the UI renders, so this is the actual
// authorization boundary; the UI hiding the field is a convenience, not
// the enforcement.
export function resolveCostPriceForUpdate(
  role: string | null | undefined,
  hasCostField: boolean,
  costPriceRaw: number
): { costPrice?: number | null } {
  if (!hasCostField || !isOwner(role ?? '')) return {};
  return { costPrice: !isNaN(costPriceRaw) && costPriceRaw > 0 ? costPriceRaw : null };
}
