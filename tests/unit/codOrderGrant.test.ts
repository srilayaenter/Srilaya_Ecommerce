import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCartItemFindMany,
  mockCartItemDeleteMany,
  mockProductVariantUpdateMany,
  mockProductVariantFindMany,
  mockOrderCreate,
  mockOrderItemCreate,
  mockTransaction,
  mockCookieSet,
  mockCookieGet,
  mockRedirect,
  mockGetServerSession,
  mockSendEmail,
  mockSendWhatsApp,
  mockLogOrderPlaced,
  mockLogStockChanges,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockCartItemFindMany: vi.fn(),
  mockCartItemDeleteMany: vi.fn(),
  mockProductVariantUpdateMany: vi.fn(),
  mockProductVariantFindMany: vi.fn(),
  mockOrderCreate: vi.fn(),
  mockOrderItemCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockCookieSet: vi.fn(),
  mockCookieGet: vi.fn(),
  mockRedirect: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); }),
  mockGetServerSession: vi.fn(),
  mockSendEmail: vi.fn(),
  mockSendWhatsApp: vi.fn(),
  mockLogOrderPlaced: vi.fn(),
  mockLogStockChanges: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    cartItem: { findMany: mockCartItemFindMany, deleteMany: mockCartItemDeleteMany },
    productVariant: { updateMany: mockProductVariantUpdateMany, findMany: mockProductVariantFindMany },
    order: { create: mockOrderCreate },
    orderItem: { create: mockOrderItemCreate },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: mockUserFindUnique },
    $transaction: mockTransaction,
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mockCookieGet, set: mockCookieSet }),
}));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("../../apps/web/lib/emails/adminAlerts", () => ({ buildLowStockAlert: () => "<html></html>" }));
vi.mock("../../apps/web/lib/emails/orderConfirmation", () => ({ buildOrderConfirmationEmail: () => "<html></html>" }));
vi.mock("../../apps/web/lib/generateInvoicePdf", () => ({ generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("")) }));
vi.mock("../../apps/web/lib/whatsapp", () => ({
  sendWhatsApp: mockSendWhatsApp,
  orderConfirmedMessage: () => "msg",
}));
vi.mock("../../apps/web/lib/loyalty", () => ({
  earnPoints: vi.fn().mockResolvedValue(undefined),
  redeemPoints: vi.fn().mockResolvedValue(undefined),
  getBalance: vi.fn().mockResolvedValue(0),
  pointsToRupees: vi.fn().mockReturnValue(0),
  MIN_REDEEM_POINTS: 100,
  maxRedeemablePoints: vi.fn().mockReturnValue(0),
  processReferral: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../apps/web/lib/pricing", () => ({
  calcCouponDiscount: vi.fn().mockReturnValue(0),
  calcOrderTotal: (base: number, loyalty: number, coupon: number) => base - loyalty - coupon,
  calcOrderSubtotals: (items: { price: number; quantity: number; gstRate: number }[]) => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxTotal = items.reduce((s, i) => s + i.price * i.quantity * (i.gstRate / 100), 0);
    return { subtotal, taxTotal };
  },
}));
vi.mock("../../apps/web/lib/stockLog", () => ({ logStockChanges: mockLogStockChanges }));
vi.mock("../../apps/web/lib/logger", () => ({ logOrderPlaced: mockLogOrderPlaced }));

import { createOrder } from "../../apps/web/app/actions/orders";
import { orderAccessCookieName } from "../../apps/web/lib/orderAccess";

function makeFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("name", "Test Guest");
  fd.set("email", "guest@example.com");
  fd.set("phone", "9876500000");
  fd.set("address", "1 Test Lane");
  fd.set("city", "Bengaluru");
  fd.set("state", "Karnataka");
  fd.set("zipCode", "560067");
  fd.set("courierName", "");
  fd.set("shippingFee", "0");
  fd.set("paymentMethod", "cod");
  fd.set("redeemedPoints", "0");
  fd.set("referralCode", "");
  fd.set("couponCode", "");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

const CART_ITEMS = [
  {
    variantId: "variant-1",
    price: { toString: () => "100" } as any,
    quantity: 1,
    gstRate: { toString: () => "5" } as any,
    variant: { sku: "SKU1", product: { title: "Test Product" } },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieGet.mockReturnValue({ value: "cart-1" });
  mockCartItemFindMany.mockResolvedValue(CART_ITEMS);
  mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
  mockProductVariantFindMany.mockResolvedValue([]);
  mockGetServerSession.mockResolvedValue(null); // guest by default
  mockSendEmail.mockResolvedValue({ success: true });
  mockSendWhatsApp.mockResolvedValue(undefined);
  mockLogStockChanges.mockResolvedValue(undefined);
  mockUserFindUnique.mockResolvedValue({ id: "user-1" });

  // Default transaction: succeeds, creates order "order-cod-1"
  mockTransaction.mockImplementation(async (fn: any) => {
    const tx = {
      productVariant: { updateMany: mockProductVariantUpdateMany },
      order: { create: mockOrderCreate },
      orderItem: { create: mockOrderItemCreate },
    };
    return fn(tx);
  });
  mockProductVariantUpdateMany.mockResolvedValue({ count: 1 });
  mockOrderCreate.mockResolvedValue({ id: "order-cod-1" });
  mockOrderItemCreate.mockResolvedValue({});
});

describe("createOrder — COD guest access grant", () => {
  it("mints a grant for a guest COD order after the transaction commits, before redirect", async () => {
    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/confirm/order-cod-1",
    );

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    const [cookieName, cookieValue, cookieOptions] = mockCookieSet.mock.calls[0];
    expect(cookieName).toBe(orderAccessCookieName("order-cod-1"));
    expect(cookieValue).toMatch(/^\d+\.[a-f0-9]{64}$/);
    // Path is widened to "/" at this call site only (orderAccess.ts's default
    // "/orders/{orderId}" doesn't cover /checkout/confirm/{orderId}) — every
    // other attribute (httpOnly, secure, sameSite, maxAge) is untouched.
    expect(cookieOptions.path).toBe("/");
    expect(cookieOptions.httpOnly).toBe(true);
    expect(cookieOptions.sameSite).toBe("lax");
  });

  it("does NOT mint a grant for an online (non-COD) order — that happens at payment verification instead", async () => {
    await expect(createOrder(makeFormData({ paymentMethod: "razorpay" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/pay/order-cod-1",
    );
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("does NOT mint a grant when the transaction fails (insufficient stock)", async () => {
    mockProductVariantUpdateMany.mockResolvedValue({ count: 0 }); // triggers INSUFFICIENT_STOCK

    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow(/NEXT_REDIRECT:\/checkout\?error=/);
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  it("does NOT mint a grant when the transaction throws an unexpected error", async () => {
    mockTransaction.mockRejectedValue(new Error("DB connection lost"));

    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow("DB connection lost");
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("still mints a grant for a logged-in user's COD order (harmless — canAccessOrder ignores it for owned orders)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", role: "customer" } });
    mockOrderCreate.mockResolvedValue({ id: "order-cod-owned-1" });

    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/confirm/order-cod-owned-1",
    );

    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    // The order itself is still created with the session's userId — verified via the order.create call args.
    const createArg = mockOrderCreate.mock.calls[0][0];
    expect(createArg.data.userId).toBe("user-1");
  });

  it("never logs the raw grant cookie value (the signed access token itself)", async () => {
    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow("NEXT_REDIRECT:");

    const [, cookieValue] = mockCookieSet.mock.calls[0];
    for (const call of mockLogOrderPlaced.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(cookieValue);
    }
  });
});
