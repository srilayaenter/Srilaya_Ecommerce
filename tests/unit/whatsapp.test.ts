import { describe, it, expect, beforeAll } from "vitest";
import {
  orderConfirmedMessage,
  orderDeliveredMessage,
  orderDispatchedMessage,
} from "../../apps/web/lib/whatsapp";

beforeAll(() => {
  process.env.NEXTAUTH_URL = "https://srilaya.com";
});

// ── orderConfirmedMessage ─────────────────────────────────────────────────────

describe("orderConfirmedMessage", () => {
  const base = {
    customerName: "Kavya",
    shortId: "ORD001",
    total: 498,
    paymentMethod: "online",
  };

  it("contains the customer name", () => {
    expect(orderConfirmedMessage(base)).toContain("Kavya");
  });

  it("contains the order shortId", () => {
    expect(orderConfirmedMessage(base)).toContain("ORD001");
  });

  it("contains the formatted total", () => {
    expect(orderConfirmedMessage(base)).toContain("498.00");
  });

  it("online payment shows 'Online' label", () => {
    expect(orderConfirmedMessage(base)).toContain("Online");
  });

  it("cod payment shows 'Pay on Delivery' label", () => {
    const msg = orderConfirmedMessage({ ...base, paymentMethod: "cod" });
    expect(msg).toContain("Pay on Delivery");
  });

  it("contains a track URL with the shortId", () => {
    const msg = orderConfirmedMessage(base);
    expect(msg).toContain("track?orderId=ORD001");
  });

  it("total is formatted to 2 decimal places", () => {
    const msg = orderConfirmedMessage({ ...base, total: 100 });
    expect(msg).toContain("100.00");
  });
});

// ── orderDeliveredMessage ─────────────────────────────────────────────────────

describe("orderDeliveredMessage", () => {
  const base = { customerName: "Arjun", shortId: "ORD002" };

  it("contains the customer name", () => {
    expect(orderDeliveredMessage(base)).toContain("Arjun");
  });

  it("contains the order shortId", () => {
    expect(orderDeliveredMessage(base)).toContain("ORD002");
  });

  it("contains a link to /product (shop again)", () => {
    expect(orderDeliveredMessage(base)).toContain("/product");
  });

  it("contains a track link", () => {
    expect(orderDeliveredMessage(base)).toContain("/track");
  });

  it("mentions delivered", () => {
    expect(orderDeliveredMessage(base).toLowerCase()).toContain("delivered");
  });
});

// ── orderDispatchedMessage ────────────────────────────────────────────────────

describe("orderDispatchedMessage", () => {
  const base = {
    customerName: "Meena",
    shortId: "ORD003",
    courier: "Delhivery",
    trackingNumber: "DL1234567890",
    trackingUrl: "https://track.delhivery.com/DL1234567890",
  };

  it("contains the customer name", () => {
    expect(orderDispatchedMessage(base)).toContain("Meena");
  });

  it("contains the order shortId", () => {
    expect(orderDispatchedMessage(base)).toContain("ORD003");
  });

  it("contains the courier name", () => {
    expect(orderDispatchedMessage(base)).toContain("Delhivery");
  });

  it("contains the tracking number", () => {
    expect(orderDispatchedMessage(base)).toContain("DL1234567890");
  });

  it("includes the tracking URL when provided", () => {
    expect(orderDispatchedMessage(base)).toContain("https://track.delhivery.com/DL1234567890");
  });

  it("omits tracking URL line when trackingUrl is null", () => {
    const msg = orderDispatchedMessage({ ...base, trackingUrl: null });
    expect(msg).not.toContain("Track shipment:");
    expect(msg).toContain("DL1234567890"); // tracking number still present
  });

  it("omits tracking URL line when trackingUrl is undefined", () => {
    const { trackingUrl: _, ...noUrl } = base;
    const msg = orderDispatchedMessage(noUrl);
    expect(msg).not.toContain("Track shipment:");
  });

  it("mentions dispatched", () => {
    expect(orderDispatchedMessage(base).toLowerCase()).toContain("dispatched");
  });
});
