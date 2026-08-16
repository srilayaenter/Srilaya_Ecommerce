import { describe, it, expect } from "vitest";
import { getZone } from "../../apps/web/lib/shipping";

// ── PIN prefix → state mapping ────────────────────────────────────────────────
// Mirror of PREFIX_TO_STATE in app/api/pincode/[pin]/route.ts.
// Tests verify that each prefix resolves to the correct state AND that
// getZone() maps that state to the expected shipping zone.
// Format: [prefix, expectedState, expectedZone]

const PREFIX_TO_STATE: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana", "13": "Haryana",
  "14": "Punjab", "15": "Punjab", "16": "Punjab",
  "17": "Himachal Pradesh",
  "18": "Jammu and Kashmir", "19": "Jammu and Kashmir",
  "20": "Uttar Pradesh", "21": "Uttar Pradesh", "22": "Uttar Pradesh",
  "23": "Uttar Pradesh", "24": "Uttar Pradesh", "25": "Uttar Pradesh",
  "26": "Uttar Pradesh", "27": "Uttar Pradesh", "28": "Uttar Pradesh",
  "29": "Uttar Pradesh",
  "30": "Rajasthan", "31": "Rajasthan", "32": "Rajasthan",
  "33": "Rajasthan", "34": "Rajasthan",
  "36": "Gujarat", "37": "Gujarat", "38": "Gujarat", "39": "Gujarat",
  "40": "Maharashtra", "41": "Maharashtra", "42": "Maharashtra",
  "43": "Maharashtra", "44": "Maharashtra",
  "45": "Madhya Pradesh", "46": "Madhya Pradesh", "47": "Madhya Pradesh",
  "48": "Madhya Pradesh", "49": "Chhattisgarh",
  "50": "Telangana", "51": "Telangana",
  "52": "Andhra Pradesh", "53": "Andhra Pradesh",
  "54": "Karnataka", "55": "Karnataka", "56": "Karnataka",
  "57": "Karnataka", "58": "Karnataka", "59": "Karnataka",
  "60": "Tamil Nadu", "61": "Tamil Nadu", "62": "Tamil Nadu",
  "63": "Tamil Nadu", "64": "Tamil Nadu",
  "65": "Tamil Nadu", "66": "Tamil Nadu",
  "67": "Kerala", "68": "Kerala", "69": "Kerala",
  "70": "West Bengal", "71": "West Bengal", "72": "West Bengal",
  "73": "West Bengal", "74": "West Bengal",
  "75": "Odisha", "76": "Odisha", "77": "Odisha",
  "78": "Assam", "79": "Assam",
  "80": "Bihar", "81": "Bihar", "82": "Bihar",
  "83": "Bihar", "84": "Bihar", "85": "Jharkhand",
  "86": "Jharkhand", "87": "Jharkhand",
};

// ── pincode format validation (mirrors route logic) ───────────────────────────

function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

function resolvePin(pin: string): { serviceable: boolean; state?: string; zone?: string } {
  if (!isValidPin(pin)) return { serviceable: false };
  const prefix = pin.slice(0, 2);
  const state = PREFIX_TO_STATE[prefix];
  if (!state) return { serviceable: false };
  return { serviceable: true, state, zone: getZone(state) };
}

// ── format validation ─────────────────────────────────────────────────────────

describe("pincode format validation", () => {
  it("accepts a valid 6-digit pincode", () => {
    expect(isValidPin("560001")).toBe(true);
    expect(isValidPin("600001")).toBe(true);
    expect(isValidPin("110001")).toBe(true);
  });

  it("rejects fewer than 6 digits", () => {
    expect(isValidPin("1234")).toBe(false);
    expect(isValidPin("56000")).toBe(false);
  });

  it("rejects more than 6 digits", () => {
    expect(isValidPin("5600011")).toBe(false);
  });

  it("rejects alphanumeric", () => {
    expect(isValidPin("56000A")).toBe(false);
    expect(isValidPin("ABC123")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPin("")).toBe(false);
  });

  it("rejects string with spaces", () => {
    expect(isValidPin("560 001")).toBe(false);
  });
});

// ── Karnataka (local zone) ────────────────────────────────────────────────────

describe("Karnataka pincodes → local zone", () => {
  const kaPins = ["560001", "570001", "580001", "590001", "591001"];

  for (const pin of kaPins) {
    it(`${pin} (prefix ${pin.slice(0, 2)}) → Karnataka → local`, () => {
      const result = resolvePin(pin);
      expect(result.serviceable).toBe(true);
      expect(result.state).toBe("Karnataka");
      expect(result.zone).toBe("local");
    });
  }

  it("all Karnataka prefixes 54–59 map to Karnataka", () => {
    for (const prefix of ["54", "55", "56", "57", "58", "59"]) {
      expect(PREFIX_TO_STATE[prefix]).toBe("Karnataka");
    }
  });
});

// ── South India (regional zone) ───────────────────────────────────────────────

describe("Tamil Nadu pincodes → regional zone", () => {
  const tnPins = ["600001", "610001", "620001", "630001", "640001", "650001", "660001"];

  for (const pin of tnPins) {
    it(`${pin} (prefix ${pin.slice(0, 2)}) → Tamil Nadu → regional`, () => {
      const result = resolvePin(pin);
      expect(result.serviceable).toBe(true);
      expect(result.state).toBe("Tamil Nadu");
      expect(result.zone).toBe("regional");
    });
  }

  it("all Tamil Nadu prefixes 60–66 map to Tamil Nadu", () => {
    for (const prefix of ["60", "61", "62", "63", "64", "65", "66"]) {
      expect(PREFIX_TO_STATE[prefix]).toBe("Tamil Nadu");
    }
  });
});

describe("Telangana pincodes → regional zone", () => {
  it("500001 (prefix 50) → Telangana → regional", () => {
    const result = resolvePin("500001");
    expect(result.serviceable).toBe(true);
    expect(result.state).toBe("Telangana");
    expect(result.zone).toBe("regional");
  });

  it("510001 (prefix 51) → Telangana → regional", () => {
    const result = resolvePin("510001");
    expect(result.state).toBe("Telangana");
    expect(result.zone).toBe("regional");
  });
});

describe("Andhra Pradesh pincodes → regional zone", () => {
  it("520001 (prefix 52) → Andhra Pradesh → regional", () => {
    const result = resolvePin("520001");
    expect(result.state).toBe("Andhra Pradesh");
    expect(result.zone).toBe("regional");
  });
});

describe("Kerala pincodes → regional zone", () => {
  it("all Kerala prefixes 67–69 → regional", () => {
    for (const prefix of ["67", "68", "69"]) {
      const pin = prefix + "0001";
      const result = resolvePin(pin);
      expect(result.state).toBe("Kerala");
      expect(result.zone).toBe("regional");
    }
  });
});

describe("Goa — falls under regional via getZone", () => {
  it("getZone('Goa') → regional", () => {
    expect(getZone("Goa")).toBe("regional");
  });
});

// ── National zone ─────────────────────────────────────────────────────────────

describe("national zone pincodes", () => {
  it("Delhi 110001 (prefix 11) → national", () => {
    const result = resolvePin("110001");
    expect(result.serviceable).toBe(true);
    expect(result.state).toBe("Delhi");
    expect(result.zone).toBe("national");
  });

  it("Maharashtra 400001 (prefix 40) → national", () => {
    const result = resolvePin("400001");
    expect(result.state).toBe("Maharashtra");
    expect(result.zone).toBe("national");
  });

  it("Rajasthan 302001 (prefix 30) → national", () => {
    const result = resolvePin("302001");
    expect(result.state).toBe("Rajasthan");
    expect(result.zone).toBe("national");
  });

  it("West Bengal 700001 (prefix 70) → national", () => {
    const result = resolvePin("700001");
    expect(result.state).toBe("West Bengal");
    expect(result.zone).toBe("national");
  });

  it("Bihar 800001 (prefix 80) → national", () => {
    const result = resolvePin("800001");
    expect(result.state).toBe("Bihar");
    expect(result.zone).toBe("national");
  });

  it("Uttar Pradesh 201001 (prefix 20) → national", () => {
    const result = resolvePin("201001");
    expect(result.state).toBe("Uttar Pradesh");
    expect(result.zone).toBe("national");
  });
});

// ── Unrecognised prefixes ─────────────────────────────────────────────────────

describe("unrecognised or gap prefixes → not serviceable", () => {
  it("prefix 35 (gap in Rajasthan) → not serviceable", () => {
    expect(resolvePin("350001").serviceable).toBe(false);
  });

  it("prefix 90 (no state) → not serviceable", () => {
    expect(resolvePin("900001").serviceable).toBe(false);
  });

  it("prefix 99 → not serviceable", () => {
    expect(resolvePin("990001").serviceable).toBe(false);
  });

  it("prefix 00 → not serviceable", () => {
    expect(resolvePin("000001").serviceable).toBe(false);
  });
});

// ── Prefix map completeness ───────────────────────────────────────────────────

describe("prefix map sanity", () => {
  it("has at least 50 prefix entries", () => {
    expect(Object.keys(PREFIX_TO_STATE).length).toBeGreaterThanOrEqual(50);
  });

  it("every value is a non-empty state name string", () => {
    for (const [prefix, state] of Object.entries(PREFIX_TO_STATE)) {
      expect(typeof state).toBe("string");
      expect(state.length).toBeGreaterThan(0);
      expect(typeof prefix).toBe("string");
      expect(prefix).toHaveLength(2);
    }
  });

  it("no duplicate state names point to conflicting zones", () => {
    // All entries for the same state must resolve to the same zone
    const stateZones = new Map<string, string>();
    for (const state of Object.values(PREFIX_TO_STATE)) {
      const zone = getZone(state);
      if (stateZones.has(state)) {
        expect(stateZones.get(state)).toBe(zone);
      } else {
        stateZones.set(state, zone);
      }
    }
  });

  it("Karnataka entries all resolve to local zone", () => {
    const kaPrefixes = Object.entries(PREFIX_TO_STATE)
      .filter(([, state]) => state === "Karnataka")
      .map(([prefix]) => prefix);
    expect(kaPrefixes.length).toBe(6); // 54–59
    for (const prefix of kaPrefixes) {
      expect(getZone("Karnataka")).toBe("local");
    }
  });

  it("Tamil Nadu entries all resolve to regional zone", () => {
    const tnPrefixes = Object.entries(PREFIX_TO_STATE)
      .filter(([, state]) => state === "Tamil Nadu")
      .map(([prefix]) => prefix);
    expect(tnPrefixes.length).toBe(7); // 60–66
    for (const _ of tnPrefixes) {
      expect(getZone("Tamil Nadu")).toBe("regional");
    }
  });
});
