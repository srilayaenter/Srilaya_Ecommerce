import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCartItemFindMany,
  mockCartItemDeleteMany,
  mockProductVariantUpdateMany,
  mockProductVariantFindMany,
  mockOrderCreate,
  mockOrderItemCreate,
  mockOrderFindFirst,
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
  mockOrderFindFirst: vi.fn(),
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
    order: { create: mockOrderCreate, findFirst: mockOrderFindFirst },
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
  fd.set("paymentMethod", "online");
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

function liveUniqueViolation(target: string | string[] = ["cartId"]) {
  const err: any = new Error("Unique constraint failed on the constraint: `Order_cartId_live_unique`");
  err.code = "P2002";
  err.meta = { target };
  return err;
}

function unrelatedViolation() {
  const err: any = new Error("Unique constraint failed on the constraint: `Coupon_code_key`");
  err.code = "P2002";
  err.meta = { target: ["code"] };
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-fallback-secret";
  mockCookieGet.mockReturnValue({ value: "cart-active-1" });
  mockCartItemFindMany.mockResolvedValue(CART_ITEMS);
  mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
  mockProductVariantFindMany.mockResolvedValue([]);
  mockGetServerSession.mockResolvedValue(null); // guest by default
  mockSendEmail.mockResolvedValue({ success: true });
  mockSendWhatsApp.mockResolvedValue(undefined);
  mockLogStockChanges.mockResolvedValue(undefined);
  mockUserFindUnique.mockResolvedValue({ id: "user-1" });
  mockProductVariantUpdateMany.mockResolvedValue({ count: 1 });
  mockOrderItemCreate.mockResolvedValue({});
});

describe("createOrder — live-order conflict (Order_cartId_live_unique)", () => {
  it("redirects a guest to the existing PENDING order's pay page instead of creating a duplicate", async () => {
    mockTransaction.mockRejectedValue(liveUniqueViolation());
    mockOrderFindFirst.mockResolvedValue({ id: "existing-order-1", status: "pending" });

    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }

    expect(mockOrderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cartId: "cart-active-1", status: { in: ["pending", "cod_pending"] } },
      }),
    );
    expect(caughtPath).toMatch(/^\/checkout\/pay\/existing-order-1\?pay_token=/);
    const token = new URL(caughtPath, "http://localhost").searchParams.get("pay_token");
    expect(verifyPayCapabilityToken("existing-order-1", token!)).toBe(true);
  });

  it("redirects a logged-in customer to the existing order's pay page with no pay_token", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", role: "customer" } });
    mockTransaction.mockRejectedValue(liveUniqueViolation());
    mockOrderFindFirst.mockResolvedValue({ id: "existing-order-2", status: "pending" });

    await expect(createOrder(makeFormData({ paymentMethod: "online" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/pay/existing-order-2",
    );
  });

  it("redirects to the existing order's CONFIRM page when the conflicting order is cod_pending", async () => {
    mockTransaction.mockRejectedValue(liveUniqueViolation());
    mockOrderFindFirst.mockResolvedValue({ id: "existing-cod-order", status: "cod_pending" });

    await expect(createOrder(makeFormData({ paymentMethod: "online" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/confirm/existing-cod-order",
    );
  });

  it("does NOT create a new order or clear the cart when redirecting on conflict", async () => {
    mockTransaction.mockRejectedValue(liveUniqueViolation());
    mockOrderFindFirst.mockResolvedValue({ id: "existing-order-3", status: "pending" });

    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch { /* redirect throws by design */ }

    expect(mockOrderCreate).not.toHaveBeenCalled();
    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
  });

  it("matches the constraint name when meta.target is a plain string, not just an array", async () => {
    mockTransaction.mockRejectedValue(liveUniqueViolation("cartId"));
    mockOrderFindFirst.mockResolvedValue({ id: "existing-order-4", status: "pending" });

    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }
    expect(caughtPath).toContain("existing-order-4");
  });
});

describe("createOrder — unrelated P2002 errors are not swallowed by the conflict handler", () => {
  it("re-throws an unrelated unique-constraint violation instead of treating it as a live-order conflict", async () => {
    mockTransaction.mockRejectedValue(unrelatedViolation());

    await expect(createOrder(makeFormData({ paymentMethod: "online" }))).rejects.toThrow(
      "Unique constraint failed on the constraint: `Coupon_code_key`",
    );
    expect(mockOrderFindFirst).not.toHaveBeenCalled();
  });
});

describe("createOrder — retry after the prior order is no longer live (scenario #8 control case)", () => {
  it("creates a genuinely new order when no pending/cod_pending order exists for this cart (expired/failed/paid/cancelled don't conflict)", async () => {
    // No P2002 thrown at all — the DB constraint only rejects when a live row
    // already exists, so an expired/failed/paid/cancelled prior order simply
    // never triggers the conflict path in the first place.
    mockTransaction.mockImplementation(async (fn: any) => {
      const tx = {
        productVariant: { updateMany: mockProductVariantUpdateMany },
        order: { create: mockOrderCreate },
        orderItem: { create: mockOrderItemCreate },
      };
      return fn(tx);
    });
    mockOrderCreate.mockResolvedValue({ id: "brand-new-order" });

    let caughtPath = "";
    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch (e: any) {
      caughtPath = e.message.replace("NEXT_REDIRECT:", "");
    }

    expect(mockOrderCreate).toHaveBeenCalledTimes(1);
    expect(mockOrderFindFirst).not.toHaveBeenCalled();
    expect(caughtPath).toContain("brand-new-order");
  });
});

describe("createOrder — INSUFFICIENT_STOCK handling is unaffected by the new conflict branch", () => {
  it("still redirects to /checkout with the stock error, not the conflict path", async () => {
    mockTransaction.mockRejectedValue(new Error("INSUFFICIENT_STOCK:Test Product (M)"));

    await expect(createOrder(makeFormData({ paymentMethod: "online" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/checkout\?error=/,
    );
    expect(mockOrderFindFirst).not.toHaveBeenCalled();
  });
});
