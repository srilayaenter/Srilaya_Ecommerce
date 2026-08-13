import { describe, it, expect } from "vitest";
import { BRAND } from "../../apps/web/lib/brand";

describe("BRAND constant", () => {
  it("has correct name", () => {
    expect(BRAND.name).toBe("SriLaYa Naturals");
  });

  it("has a non-empty tagline", () => {
    expect(BRAND.tagline.length).toBeGreaterThan(0);
  });

  it("has a valid email address", () => {
    expect(BRAND.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("has a non-empty phone number", () => {
    expect(BRAND.phone.length).toBeGreaterThan(0);
  });

  it("has a non-empty address", () => {
    expect(BRAND.address.length).toBeGreaterThan(0);
  });

  it("primary color is the correct brand green", () => {
    expect(BRAND.colors.primary).toBe("#006A38");
  });

  it("has a positive default GST rate", () => {
    expect(BRAND.business.gstRate).toBeGreaterThan(0);
  });

  it("has a positive minimum order amount", () => {
    expect(BRAND.business.minOrderAmount).toBeGreaterThan(0);
  });

  it("has a non-negative shipping fee", () => {
    expect(BRAND.business.shippingFee).toBeGreaterThanOrEqual(0);
  });

  it("has a valid Instagram URL", () => {
    expect(BRAND.social.instagram).toContain("instagram.com");
  });
});
