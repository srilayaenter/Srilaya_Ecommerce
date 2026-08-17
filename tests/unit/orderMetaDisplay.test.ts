import { describe, it, expect } from "vitest";
import { classifyInvoiceNo } from "../../apps/web/lib/orderMetaDisplay";

describe("classifyInvoiceNo — Phase 1 display cleanup", () => {
  it("classifies null/undefined/empty as none", () => {
    expect(classifyInvoiceNo(null)).toEqual({ kind: "none" });
    expect(classifyInvoiceNo(undefined)).toEqual({ kind: "none" });
    expect(classifyInvoiceNo("")).toEqual({ kind: "none" });
  });

  it("classifies a plain invoice number as invoice", () => {
    expect(classifyInvoiceNo("INV-2026-00123")).toEqual({
      kind: "invoice",
      text: "INV-2026-00123",
    });
  });

  it("classifies a NOTE:-prefixed value as note, stripping the prefix", () => {
    expect(classifyInvoiceNo("NOTE:Fragile, handle with care")).toEqual({
      kind: "note",
      text: "Fragile, handle with care",
    });
  });

  it("REGRESSION GUARD: a COURIER:-prefixed value is never shown as an invoice number", () => {
    const result = classifyInvoiceNo("COURIER:delhivery");
    expect(result.kind).not.toBe("invoice");
    expect(result).toEqual({ kind: "legacy_courier", text: "delhivery" });
  });

  it("strips the COURIER: prefix cleanly, including multi-word courier keys", () => {
    expect(classifyInvoiceNo("COURIER:blue_dart_express")).toEqual({
      kind: "legacy_courier",
      text: "blue_dart_express",
    });
  });
});
