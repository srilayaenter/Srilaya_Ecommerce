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
import { verifyPayCapabilityToken } from "../../apps/web/lib/payAuth";

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
  fd.set("paymentMethod", "razorpay");
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
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-fallback-secret";
  mockCookieGet.mockReturnValue({ value: "cart-1" });
  mockCartItemFindMany.mockResolvedValue(CART_ITEMS);
  mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
  mockProductVariantFindMany.mockResolvedValue([]);
  mockGetServerSession.mockResolvedValue(null); // guest by default
  mockSendEmail.mockResolvedValue({ success: true });
  mockSendWhatsApp.mockResolvedValue(undefined);
  mockLogStockChanges.mockResolvedValue(undefined);
  mockUserFindUnique.mockResolvedValue({ id: "user-1" });

  mockTransaction.mockImplementation(async (fn: any) => {
    const tx = {
      productVariant: { updateMany: mockProductVariantUpdateMany },
      order: { create: mockOrderCreate },
      orderItem: { create: mockOrderItemCreate },
    };
    return fn(tx);
  });
  mockProductVariantUpdateMany.mockResolvedValue({ count: 1 });
  mockOrderCreate.mockResolvedValue({ id: "order-online-1" });
  mockOrderItemCreate.mockResolvedValue({});
});

describe("createOrder — online pre-payment capability minting", () => {
  it("mints a pay capability token appended to the /checkout/pay redirect for a guest online order", async () => {
    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "razorpay" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }

    expect(caughtPath).toMatch(/^\/checkout\/pay\/order-online-1\?pay_token=/);
    const token = new URL(caughtPath, "http://localhost").searchParams.get("pay_token");
    expect(token).toBeTruthy();
    expect(verifyPayCapabilityToken("order-online-1", token!)).toBe(true);
  });

  it("does NOT append a pay token for a logged-in user's online order — session already covers ownership", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", role: "customer" } });
    mockOrderCreate.mockResolvedValue({ id: "order-online-owned-1" });

    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "razorpay" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }

    expect(caughtPath).toBe("/checkout/pay/order-online-owned-1");
    expect(caughtPath).not.toContain("pay_token");
  });

  it("does NOT mint a pay token for a COD order", async () => {
    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/confirm/order-online-1",
    );
    // No pay_token anywhere — confirm via the redirect target string itself,
    // and confirm the COD guest-confirmation cookie mint still fires normally.
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    const [cookieName] = mockCookieSet.mock.calls[0];
    expect(cookieName).not.toMatch(/pay/i);
  });

  it("mints no pay capability when the transaction fails (insufficient stock)", async () => {
    mockProductVariantUpdateMany.mockResolvedValue({ count: 0 });
    await expect(createOrder(makeFormData({ paymentMethod: "razorpay" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/checkout\?error=/,
    );
    expect(mockOrderCreate).not.toHaveBeenCalled();
  });

  it("mints no pay capability when the transaction throws an unexpected error", async () => {
    mockTransaction.mockRejectedValue(new Error("DB connection lost"));
    await expect(createOrder(makeFormData({ paymentMethod: "razorpay" }))).rejects.toThrow("DB connection lost");
  });

  it("the minted token is scoped to the created order only", async () => {
    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "razorpay" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }
    const token = new URL(caughtPath, "http://localhost").searchParams.get("pay_token")!;
    expect(verifyPayCapabilityToken("order-online-1", token)).toBe(true);
    expect(verifyPayCapabilityToken("some-other-order-id", token)).toBe(false);
  });
});
