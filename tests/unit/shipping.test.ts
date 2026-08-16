import { describe, it, expect } from "vitest";
import {
  getZone,
  getZoneLabel,
  calculateShipping,
  getAllCourierOptions,
} from "../../apps/web/lib/shipping";

// ── getZone ──────────────────────────────────────────────────────────────────

describe("getZone", () => {
  describe("local (Karnataka)", () => {
    it("'Karnataka' → local", () => {
      expect(getZone("Karnataka")).toBe("local");
    });

    it("'karnataka' lowercase → local", () => {
      expect(getZone("karnataka")).toBe("local");
    });

    it("'KARNATAKA' uppercase → local", () => {
      expect(getZone("KARNATAKA")).toBe("local");
    });

    it("with leading/trailing spaces → local", () => {
      expect(getZone("  Karnataka  ")).toBe("local");
    });
  });

  describe("regional (South India)", () => {
    it("'Tamil Nadu' → regional", () => {
      expect(getZone("Tamil Nadu")).toBe("regional");
    });

    it("'tamilnadu' no-space variant → regional", () => {
      expect(getZone("tamilnadu")).toBe("regional");
    });

    it("'Telangana' → regional", () => {
      expect(getZone("Telangana")).toBe("regional");
    });

    it("'Andhra Pradesh' → regional", () => {
      expect(getZone("Andhra Pradesh")).toBe("regional");
    });

    it("'Kerala' → regional", () => {
      expect(getZone("Kerala")).toBe("regional");
    });

    it("'Goa' → regional", () => {
      expect(getZone("Goa")).toBe("regional");
    });

    it("'Puducherry' → regional", () => {
      expect(getZone("Puducherry")).toBe("regional");
    });

    it("'Pondicherry' alias → regional", () => {
      expect(getZone("Pondicherry")).toBe("regional");
    });
  });

  describe("national (everything else)", () => {
    it("'Delhi' → national", () => {
      expect(getZone("Delhi")).toBe("national");
    });

    it("'Maharashtra' → national", () => {
      expect(getZone("Maharashtra")).toBe("national");
    });

    it("'Rajasthan' → national", () => {
      expect(getZone("Rajasthan")).toBe("national");
    });

    it("empty string → national (safe fallback)", () => {
      expect(getZone("")).toBe("national");
    });

    it("unknown string → national", () => {
      expect(getZone("XYZ Unknown State")).toBe("national");
    });
  });
});

// ── getZoneLabel ─────────────────────────────────────────────────────────────

describe("getZoneLabel", () => {
  it("local → 'Local (Karnataka)'", () => {
    expect(getZoneLabel("local")).toBe("Local (Karnataka)");
  });

  it("regional → 'Regional (South India)'", () => {
    expect(getZoneLabel("regional")).toBe("Regional (South India)");
  });

  it("national → 'National'", () => {
    expect(getZoneLabel("national")).toBe("National");
  });
});

// ── calculateShipping ────────────────────────────────────────────────────────

describe("calculateShipping", () => {
  describe("slab logic", () => {
    it("exactly 500 g = 1 slab → base only", () => {
      // Delhivery local: base 40, per500g 20
      expect(calculateShipping("delhivery", "local", 500)).toBe(40);
    });

    it("501 g = 2 slabs → base + 1 extra", () => {
      expect(calculateShipping("delhivery", "local", 501)).toBe(60); // 40 + 20
    });

    it("1 g = 1 slab (minimum 1 slab always)", () => {
      expect(calculateShipping("delhivery", "local", 1)).toBe(40);
    });

    it("0 g = 1 slab (no zero-cost shipment)", () => {
      expect(calculateShipping("delhivery", "local", 0)).toBe(40);
    });

    it("1000 g = 2 slabs", () => {
      expect(calculateShipping("delhivery", "local", 1000)).toBe(60); // 40 + 20
    });

    it("1001 g = 3 slabs", () => {
      expect(calculateShipping("delhivery", "local", 1001)).toBe(80); // 40 + 2×20
    });
  });

  describe("Delhivery rates", () => {
    it("regional 1300 g = 3 slabs → 70 + 2×30 = 130", () => {
      expect(calculateShipping("delhivery", "regional", 1300)).toBe(130);
    });

    it("national 500 g = 1 slab → 100", () => {
      expect(calculateShipping("delhivery", "national", 500)).toBe(100);
    });

    it("national 1000 g = 2 slabs → 100 + 45 = 145", () => {
      expect(calculateShipping("delhivery", "national", 1000)).toBe(145);
    });
  });

  describe("DTDC rates", () => {
    it("local 500 g → 35", () => {
      expect(calculateShipping("dtdc", "local", 500)).toBe(35);
    });

    it("regional 1000 g = 2 slabs → 60 + 28 = 88", () => {
      expect(calculateShipping("dtdc", "regional", 1000)).toBe(88);
    });
  });

  describe("Blue Dart rates (premium)", () => {
    it("local 500 g → 60", () => {
      expect(calculateShipping("bluedart", "local", 500)).toBe(60);
    });

    it("national 500 g → 130", () => {
      expect(calculateShipping("bluedart", "national", 500)).toBe(130);
    });
  });

  describe("India Post rates (cheapest)", () => {
    it("local 500 g → 30", () => {
      expect(calculateShipping("indiapost", "local", 500)).toBe(30);
    });

    it("national 1000 g = 2 slabs → 60 + 25 = 85", () => {
      expect(calculateShipping("indiapost", "national", 1000)).toBe(85);
    });
  });
});

// ── getAllCourierOptions ───────────────────────────────────────────────────────

describe("getAllCourierOptions", () => {
  it("returns 4 courier options", () => {
    expect(getAllCourierOptions("local", 500)).toHaveLength(4);
  });

  it("each entry has key, name, etaDays, cost", () => {
    const options = getAllCourierOptions("regional", 500);
    for (const opt of options) {
      expect(opt).toHaveProperty("key");
      expect(opt).toHaveProperty("name");
      expect(opt).toHaveProperty("etaDays");
      expect(opt).toHaveProperty("cost");
      expect(typeof opt.cost).toBe("number");
    }
  });

  it("costs are ordered: India Post cheapest, Blue Dart most expensive (local)", () => {
    const options = getAllCourierOptions("local", 500);
    const byKey = Object.fromEntries(options.map((o) => [o.key, o.cost]));
    expect(byKey.indiapost).toBeLessThan(byKey.dtdc);
    expect(byKey.dtdc).toBeLessThan(byKey.delhivery);
    expect(byKey.delhivery).toBeLessThan(byKey.bluedart);
  });

  it("costs increase with weight", () => {
    const light = getAllCourierOptions("national", 500);
    const heavy = getAllCourierOptions("national", 2000);
    for (let i = 0; i < light.length; i++) {
      expect(heavy[i].cost).toBeGreaterThan(light[i].cost);
    }
  });
});
