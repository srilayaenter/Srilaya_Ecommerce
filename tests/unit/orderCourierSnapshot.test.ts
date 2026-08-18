import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCartItemFindMany,
  mockProductVariantUpdateMany,
  mockOrderCreate,
  mockOrderItemCreate,
  mockTransaction,
  mockCookieGet,
  mockRedirect,
  mockGetServerSession,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockCartItemFindMany: vi.fn(),
  mockProductVariantUpdateMany: vi.fn(),
  mockOrderCreate: vi.fn(),
  mockOrderItemCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockCookieGet: vi.fn(),
  mockRedirect: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); }),
  mockGetServerSession: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    cartItem: { findMany: mockCartItemFindMany, deleteMany: vi.fn() },
    productVariant: { updateMany: mockProductVariantUpdateMany, findMany: vi.fn() },
    order: { create: mockOrderCreate },
    orderItem: { create: mockOrderItemCreate },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: mockUserFindUnique },
    $transaction: mockTransaction,
  },
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mockCookieGet, set: vi.fn() }) }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue({ success: true }) }));
vi.mock("../../apps/web/lib/emails/adminAlerts", () => ({ buildLowStockAlert: () => "<html></html>" }));
vi.mock("../../apps/web/lib/emails/orderConfirmation", () => ({ buildOrderConfirmationEmail: () => "<html></html>" }));
vi.mock("../../apps/web/lib/generateInvoicePdf", () => ({ generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from("")) }));
vi.mock("../../apps/web/lib/whatsapp", () => ({ sendWhatsApp: vi.fn().mockResolvedValue(undefined), orderConfirmedMessage: () => "msg" }));
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
vi.mock("../../apps/web/lib/stockLog", () => ({ logStockChanges: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../apps/web/lib/logger", () => ({ logOrderPlaced: vi.fn() }));

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
  fd.set("courierName", "delhivery");
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
  mockGetServerSession.mockResolvedValue(null);
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

describe("createOrder — Phase 3 courier snapshot", () => {
  it("writes courierKey and the resolved courierLabel for a recognized courier", async () => {
    await expect(createOrder(makeFormData({ courierName: "delhivery" }))).rejects.toThrow("NEXT_REDIRECT:");
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courierKey: "delhivery",
          courierLabel: "Delhivery",
        }),
      }),
    );
  });

  it("never writes to invoiceNo for a new order, regardless of courier selection", async () => {
    await expect(createOrder(makeFormData({ courierName: "dtdc" }))).rejects.toThrow("NEXT_REDIRECT:");
    const [[call]] = mockOrderCreate.mock.calls;
    expect(call.data.invoiceNo).toBeUndefined();
  });

  it("stores the key with a null label for an unrecognized courier key (defensive, doesn't happen via the real form)", async () => {
    await expect(createOrder(makeFormData({ courierName: "not-a-real-courier" }))).rejects.toThrow("NEXT_REDIRECT:");
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courierKey: "not-a-real-courier",
          courierLabel: undefined,
        }),
      }),
    );
  });

  it("leaves courierKey/courierLabel undefined when no courier was selected", async () => {
    await expect(createOrder(makeFormData({ courierName: "" }))).rejects.toThrow("NEXT_REDIRECT:");
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courierKey: undefined,
          courierLabel: undefined,
        }),
      }),
    );
  });
});
