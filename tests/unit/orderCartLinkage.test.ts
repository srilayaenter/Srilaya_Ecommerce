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

  mockTransaction.mockImplementation(async (fn: any) => {
    const tx = {
      productVariant: { updateMany: mockProductVariantUpdateMany },
      order: { create: mockOrderCreate },
      orderItem: { create: mockOrderItemCreate },
    };
    return fn(tx);
  });
  mockProductVariantUpdateMany.mockResolvedValue({ count: 1 });
  mockOrderCreate.mockResolvedValue({ id: "order-1" });
  mockOrderItemCreate.mockResolvedValue({});
});

describe("createOrder — persisting cartId onto the Order row", () => {
  it("persists the active cartId cookie value onto the Order for an online order", async () => {
    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch { /* redirect throws by design */ }

    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cartId: "cart-active-1" }) }),
    );
  });

  it("persists the active cartId cookie value onto the Order for a COD order too, for consistency", async () => {
    try {
      await createOrder(makeFormData({ paymentMethod: "cod" }));
    } catch { /* redirect throws by design */ }

    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cartId: "cart-active-1" }) }),
    );
  });
});

describe("createOrder — cart is NOT cleared at creation time for online orders", () => {
  it("does not delete cart items when an online order is created — clearing is deferred to payment success", async () => {
    try {
      await createOrder(makeFormData({ paymentMethod: "online" }));
    } catch { /* redirect throws by design */ }

    expect(mockCartItemDeleteMany).not.toHaveBeenCalled();
  });
});

describe("createOrder — COD cart-clear behavior is unchanged (regression guard)", () => {
  it("still clears the cart immediately when a COD order is created", async () => {
    await expect(createOrder(makeFormData({ paymentMethod: "cod" }))).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/confirm/order-1",
    );

    expect(mockCartItemDeleteMany).toHaveBeenCalledWith({ where: { cartId: "cart-active-1" } });
  });
});
