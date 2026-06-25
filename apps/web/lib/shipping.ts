// ─── Shipping Configuration ───────────────────────────────────────────────────
// Update the RATES table below with your actual negotiated courier rates.
// All amounts are in INR.
//
// How slabs work:
//   - "base"    = cost for the first 500 g (or any part thereof)
//   - "per500g" = extra cost for each additional 500 g block
//
// Example: Delhivery Regional, 1.3 kg order
//   Slabs = ceil(1300 / 500) = 3
//   Cost  = 70 + (3 - 1) × 30 = ₹130

export type CourierKey = "delhivery" | "dtdc" | "bluedart" | "indiapost";
export type ZoneKey = "local" | "regional" | "national";

export interface CourierOption {
  key: CourierKey;
  name: string;
  etaDays: string;
  cost: number;
}

// ── Courier display names + ETA ───────────────────────────────────────────────
export const COURIERS: { key: CourierKey; name: string; etaDays: string }[] = [
  { key: "delhivery",  name: "Delhivery",  etaDays: "3–5 days" },
  { key: "dtdc",       name: "DTDC",        etaDays: "3–6 days" },
  { key: "bluedart",   name: "Blue Dart",   etaDays: "2–4 days" },
  { key: "indiapost",  name: "India Post",  etaDays: "5–10 days" },
];

// ── Rate table — update with your actual contracted rates ─────────────────────
const RATES: Record<CourierKey, Record<ZoneKey, { base: number; per500g: number }>> = {
  delhivery: {
    local:    { base: 40,  per500g: 20 },
    regional: { base: 70,  per500g: 30 },
    national: { base: 100, per500g: 45 },
  },
  dtdc: {
    local:    { base: 35,  per500g: 18 },
    regional: { base: 60,  per500g: 28 },
    national: { base: 90,  per500g: 40 },
  },
  bluedart: {
    local:    { base: 60,  per500g: 30 },
    regional: { base: 90,  per500g: 45 },
    national: { base: 130, per500g: 60 },
  },
  indiapost: {
    local:    { base: 30,  per500g: 15 },
    regional: { base: 45,  per500g: 20 },
    national: { base: 60,  per500g: 25 },
  },
};

// ── Zone detection ─────────────────────────────────────────────────────────────
const LOCAL_STATES = ["karnataka"];
const REGIONAL_STATES = [
  "tamil nadu", "tamilnadu", "telangana", "andhra pradesh",
  "kerala", "goa", "puducherry", "pondicherry",
];

export function getZone(state: string): ZoneKey {
  const s = state.toLowerCase().trim();
  if (LOCAL_STATES.some((x) => s.includes(x))) return "local";
  if (REGIONAL_STATES.some((x) => s.includes(x))) return "regional";
  return "national";
}

export function getZoneLabel(zone: ZoneKey): string {
  return { local: "Local (Karnataka)", regional: "Regional (South India)", national: "National" }[zone];
}

// ── Core calculation ───────────────────────────────────────────────────────────
export function calculateShipping(
  courier: CourierKey,
  zone: ZoneKey,
  totalWeightGrams: number
): number {
  const rate = RATES[courier][zone];
  const slabs = Math.max(1, Math.ceil(totalWeightGrams / 500));
  return rate.base + (slabs - 1) * rate.per500g;
}

// Returns all couriers with costs for a given zone + weight — used to render the picker
export function getAllCourierOptions(
  zone: ZoneKey,
  totalWeightGrams: number
): CourierOption[] {
  return COURIERS.map((c) => ({
    ...c,
    cost: calculateShipping(c.key, zone, totalWeightGrams),
  }));
}
