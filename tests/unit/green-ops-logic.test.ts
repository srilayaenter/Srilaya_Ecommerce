import { describe, it, expect } from "vitest";

const {
  greenOpsFilteredItems,
  greenOpsDisplayName,
  greenOpsDisplayDetails,
  greenOpsDisplaySteps,
  greenOpsCategoryLabel,
  greenOpsCategoryBadgeClass,
  greenOpsScaleBatch,
  greenOpsBuildBaseRatios,
} = require("../../apps/green-ops/www/js/ops-logic.js");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ITEMS = [
  {
    id: 1, name: "Herbal Tooth Powder", nameTa: "மூலிகை பற்பொடி",
    category: "Wellness",
    details: "Kadukkai 15%, Nellikai 10%", detailsTa: "கடுக்காய் 15%, நெல்லிக்காய் 10%",
    steps: ["Grind", "Sieve", "Pack"],
    stepsTa: ["அரை", "சலி", "பேக்"],
    baseRatios: [{ name: "Kadukkai", nameTa: "கடுக்காய்", ratio: 0.15 },
                 { name: "Nellikai", nameTa: "நெல்லிக்காய்", ratio: 0.10 }],
  },
  {
    id: 2, name: "Argan Hair Serum", nameTa: "ஆர்கன் முடி சீரம்",
    category: "Hair Care",
    details: "Argan Oil 70%, Castor Oil 30%", detailsTa: "ஆர்கன் எண்ணெய் 70%, ஆமணக்கு 30%",
    steps: ["Blend", "Bottle"],
    stepsTa: ["கலக்கு", "பாட்டில்"],
    baseRatios: [{ name: "Argan Oil", nameTa: "ஆர்கன் எண்ணெய்", ratio: 0.70 },
                 { name: "Castor Oil", nameTa: "ஆமணக்கு", ratio: 0.30 }],
  },
  {
    id: 3, name: "Lye-Free Melt & Pour Soap", nameTa: "லை-ஃப்ரீ சோப்",
    category: "Lye-Free",
    details: "Soap Base 90%, Coconut Oil 10%", detailsTa: "சோப் பேஸ் 90%, தேங்காய் எண்ணெய் 10%",
    steps: ["Melt", "Pour"], stepsTa: ["உருக்கு", "ஊற்று"],
    baseRatios: [{ name: "Soap Base", nameTa: "சோப் பேஸ்", ratio: 0.90 },
                 { name: "Coconut Oil", nameTa: "தேங்காய் எண்ணெய்", ratio: 0.10 }],
  },
  {
    id: 4, name: "Enzyme Cleaner", nameTa: "என்சைம் கிளீனர்",
    category: "Household",
    details: "Citrus Peel 50%, Jaggery 30%", detailsTa: "எலுமிச்சை தோல் 50%, வெல்லம் 30%",
    steps: ["Ferment"], stepsTa: ["புளிக்கவை"],
    baseRatios: [{ name: "Citrus Peel", nameTa: "எலுமிச்சை தோல்", ratio: 0.50 },
                 { name: "Jaggery", nameTa: "வெல்லம்", ratio: 0.30 }],
  },
];

// ---------------------------------------------------------------------------
// greenOpsFilteredItems
// ---------------------------------------------------------------------------

describe("greenOpsFilteredItems", () => {
  it("returns all items when category is All and search is empty", () => {
    expect(greenOpsFilteredItems(ITEMS, "All", "")).toHaveLength(4);
  });

  it("filters by exact category", () => {
    const result = greenOpsFilteredItems(ITEMS, "Wellness", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("filters by Hair Care", () => {
    const result = greenOpsFilteredItems(ITEMS, "Hair Care", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("filters by Lye-Free", () => {
    const result = greenOpsFilteredItems(ITEMS, "Lye-Free", "");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it("returns empty when category has no matches", () => {
    expect(greenOpsFilteredItems(ITEMS, "Skincare", "")).toHaveLength(0);
  });

  it("filters by search query (case-insensitive, matches name)", () => {
    const result = greenOpsFilteredItems(ITEMS, "All", "argan");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("filters by search query matching details", () => {
    const result = greenOpsFilteredItems(ITEMS, "All", "citrus");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(4);
  });

  it("combines category and search filters", () => {
    const result = greenOpsFilteredItems(ITEMS, "Wellness", "tooth");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("returns empty when category and search have no combined match", () => {
    const result = greenOpsFilteredItems(ITEMS, "Hair Care", "soap");
    expect(result).toHaveLength(0);
  });

  it("returns all items when search is undefined", () => {
    expect(greenOpsFilteredItems(ITEMS, "All", undefined)).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// greenOpsDisplayName
// ---------------------------------------------------------------------------

describe("greenOpsDisplayName", () => {
  it("returns English name when lang is 'en'", () => {
    expect(greenOpsDisplayName(ITEMS[0], "en")).toBe("Herbal Tooth Powder");
  });

  it("returns Tamil name when lang is 'ta' and nameTa exists", () => {
    expect(greenOpsDisplayName(ITEMS[0], "ta")).toBe("மூலிகை பற்பொடி");
  });

  it("falls back to English name when nameTa is missing", () => {
    const item = { id: 99, name: "No Tamil", category: "Wellness", details: "" };
    expect(greenOpsDisplayName(item, "ta")).toBe("No Tamil");
  });

  it("falls back to English name when nameTa is empty string", () => {
    const item = { id: 99, name: "No Tamil", nameTa: "", category: "Wellness", details: "" };
    expect(greenOpsDisplayName(item, "ta")).toBe("No Tamil");
  });
});

// ---------------------------------------------------------------------------
// greenOpsDisplayDetails
// ---------------------------------------------------------------------------

describe("greenOpsDisplayDetails", () => {
  it("returns English details when lang is 'en'", () => {
    expect(greenOpsDisplayDetails(ITEMS[0], "en")).toBe("Kadukkai 15%, Nellikai 10%");
  });

  it("returns Tamil details when lang is 'ta' and detailsTa exists", () => {
    expect(greenOpsDisplayDetails(ITEMS[0], "ta")).toBe("கடுக்காய் 15%, நெல்லிக்காய் 10%");
  });

  it("falls back to English details when detailsTa is missing", () => {
    const item = { id: 99, name: "X", details: "English only", category: "Wellness" };
    expect(greenOpsDisplayDetails(item, "ta")).toBe("English only");
  });
});

// ---------------------------------------------------------------------------
// greenOpsDisplaySteps
// ---------------------------------------------------------------------------

describe("greenOpsDisplaySteps", () => {
  it("returns English steps when lang is 'en'", () => {
    expect(greenOpsDisplaySteps(ITEMS[0], "en")).toEqual(["Grind", "Sieve", "Pack"]);
  });

  it("returns Tamil steps when lang is 'ta' and stepsTa is non-empty", () => {
    expect(greenOpsDisplaySteps(ITEMS[0], "ta")).toEqual(["அரை", "சலி", "பேக்"]);
  });

  it("falls back to English steps when stepsTa is missing", () => {
    const item = { id: 99, name: "X", category: "Wellness", details: "", steps: ["Step A"] };
    expect(greenOpsDisplaySteps(item, "ta")).toEqual(["Step A"]);
  });

  it("falls back to English steps when stepsTa is an empty array", () => {
    const item = { id: 99, name: "X", category: "Wellness", details: "", steps: ["Step A"], stepsTa: [] };
    expect(greenOpsDisplaySteps(item, "ta")).toEqual(["Step A"]);
  });

  it("returns empty array when item has no steps", () => {
    const item = { id: 99, name: "X", category: "Wellness", details: "" };
    expect(greenOpsDisplaySteps(item, "en")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// greenOpsCategoryLabel
// ---------------------------------------------------------------------------

describe("greenOpsCategoryLabel", () => {
  it("returns English category name unchanged when lang is 'en'", () => {
    expect(greenOpsCategoryLabel("Wellness", "en")).toBe("Wellness");
    expect(greenOpsCategoryLabel("Hair Care", "en")).toBe("Hair Care");
    expect(greenOpsCategoryLabel("Lye-Free", "en")).toBe("Lye-Free");
  });

  it("returns Tamil labels for all 6 categories", () => {
    expect(greenOpsCategoryLabel("Wellness", "ta")).toBe("நலம் & வாய் பராமரிப்பு");
    expect(greenOpsCategoryLabel("Hair Care", "ta")).toBe("முடி பராமரிப்பு");
    expect(greenOpsCategoryLabel("Skincare", "ta")).toBe("சருமம் & குளியல்");
    expect(greenOpsCategoryLabel("Household", "ta")).toBe("வீட்டு & சுத்தம்");
    expect(greenOpsCategoryLabel("Lye-Free", "ta")).toBe("லை-ஃப்ரீ சோப்");
    expect(greenOpsCategoryLabel("Cold Process", "ta")).toBe("கோல்ட் ப்ராசஸ்");
  });

  it("falls back to raw category string for unknown category in Tamil", () => {
    expect(greenOpsCategoryLabel("Unknown Category", "ta")).toBe("Unknown Category");
  });
});

// ---------------------------------------------------------------------------
// greenOpsCategoryBadgeClass
// ---------------------------------------------------------------------------

describe("greenOpsCategoryBadgeClass", () => {
  const cases: [string, string][] = [
    ["Wellness",     "bg-purple-100 text-purple-800"],
    ["Hair Care",    "bg-rose-100 text-rose-800"],
    ["Skincare",     "bg-blue-100 text-blue-800"],
    ["Household",    "bg-amber-100 text-amber-800"],
    ["Lye-Free",     "bg-teal-100 text-teal-800"],
    ["Cold Process", "bg-orange-100 text-orange-800"],
  ];

  it.each(cases)("%s → %s", (category, expected) => {
    expect(greenOpsCategoryBadgeClass(category)).toBe(expected);
  });

  it("returns slate fallback for unknown category", () => {
    expect(greenOpsCategoryBadgeClass("Unknown")).toBe("bg-slate-100 text-slate-800");
  });
});

// ---------------------------------------------------------------------------
// greenOpsScaleBatch
// ---------------------------------------------------------------------------

describe("greenOpsScaleBatch", () => {
  const ratios = [
    { name: "Argan Oil", nameTa: "ஆர்கன் எண்ணெய்", ratio: 0.70 },
    { name: "Castor Oil", nameTa: "ஆமணக்கு", ratio: 0.30 },
  ];

  it("scales correctly for 1 kg batch", () => {
    const result = greenOpsScaleBatch(ratios, 1);
    expect(result[0].grams).toBe(700);
    expect(result[1].grams).toBe(300);
  });

  it("scales correctly for 2.5 kg batch", () => {
    const result = greenOpsScaleBatch(ratios, 2.5);
    expect(result[0].grams).toBe(1750);
    expect(result[1].grams).toBe(750);
  });

  it("rounds to 1 decimal place", () => {
    const odd = [{ name: "X", nameTa: "X", ratio: 1 / 3 }];
    const result = greenOpsScaleBatch(odd, 1);
    expect(result[0].grams).toBe(333.3);
  });

  it("preserves nameTa on result rows", () => {
    const result = greenOpsScaleBatch(ratios, 1);
    expect(result[0].nameTa).toBe("ஆர்கன் எண்ணெய்");
  });

  it("returns empty array for empty ratios", () => {
    expect(greenOpsScaleBatch([], 1)).toEqual([]);
  });

  it("handles 0.1 kg (100g) batch", () => {
    const result = greenOpsScaleBatch(ratios, 0.1);
    expect(result[0].grams).toBe(70);
    expect(result[1].grams).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// greenOpsBuildBaseRatios
// ---------------------------------------------------------------------------

describe("greenOpsBuildBaseRatios", () => {
  it("normalises ingredient rows into 0–1 ratios summing to 1", () => {
    const rows = [
      { name: "Coconut Oil", parts: 3 },
      { name: "Argan Oil",   parts: 1 },
    ];
    const result = greenOpsBuildBaseRatios(rows);
    expect(result).toHaveLength(2);
    expect(result[0].ratio).toBeCloseTo(0.75, 5);
    expect(result[1].ratio).toBeCloseTo(0.25, 5);
  });

  it("filters out rows with empty name or null parts", () => {
    const rows = [
      { name: "Coconut Oil", parts: 2 },
      { name: "",            parts: 1 },
      { name: "Argan Oil",   parts: null },
    ];
    const result = greenOpsBuildBaseRatios(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Coconut Oil");
    expect(result[0].ratio).toBe(1);
  });

  it("returns empty array when all rows are invalid", () => {
    expect(greenOpsBuildBaseRatios([{ name: "", parts: null }])).toEqual([]);
  });

  it("handles a single valid ingredient (ratio = 1)", () => {
    const result = greenOpsBuildBaseRatios([{ name: "X", parts: 5 }]);
    expect(result[0].ratio).toBe(1);
  });
});
