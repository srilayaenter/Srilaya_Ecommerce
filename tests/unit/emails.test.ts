import { describe, it, expect, beforeAll } from "vitest";
import { buildOrderConfirmationEmail } from "../../apps/web/lib/emails/orderConfirmation";
import { buildDispatchEmail, buildDeliveredEmail } from "../../apps/web/lib/emails/orderStatusUpdate";
import { buildPaymentFailedAlert, buildLowStockAlert } from "../../apps/web/lib/emails/adminAlerts";
import { buildPasswordResetEmail } from "../../apps/web/lib/emails/passwordReset";
import { buildAbandonedCartEmail } from "../../apps/web/lib/emails/abandonedCart";
import { buildInStoreInvoiceEmail, buildWhatsAppInvoiceText } from "../../apps/web/lib/emails/inStoreInvoice";

beforeAll(() => {
  process.env.NEXTAUTH_URL = "https://srilaya.com";
});

// ── buildOrderConfirmationEmail ───────────────────────────────────────────────

const confirmArgs = {
  customerName: "Priya",
  orderId: "clxyz00000000001",
  invoiceNo: "INV-2026-001",
  items: [
    { title: "Ragi Flakes", size: "500g", quantity: 2, price: 149 },
    { title: "Foxtail Millet", size: "1kg", quantity: 1, price: 199 },
  ],
  subtotal: 497,
  taxTotal: 24.85,
  shippingFee: 0,
  total: 521.85,
  address: "12, Main Street",
  city: "Bengaluru",
  state: "Karnataka",
  zipCode: "560001",
};

describe("buildOrderConfirmationEmail", () => {
  it("contains customer name", () => {
    expect(buildOrderConfirmationEmail(confirmArgs)).toContain("Priya");
  });

  it("contains truncated orderId (first 8 chars uppercased)", () => {
    const html = buildOrderConfirmationEmail(confirmArgs);
    expect(html).toContain("CLXYZ000");
  });

  it("contains invoice number", () => {
    expect(buildOrderConfirmationEmail(confirmArgs)).toContain("INV-2026-001");
  });

  it("contains each item title", () => {
    const html = buildOrderConfirmationEmail(confirmArgs);
    expect(html).toContain("Ragi Flakes");
    expect(html).toContain("Foxtail Millet");
  });

  it("shows Free shipping when shippingFee is 0", () => {
    expect(buildOrderConfirmationEmail(confirmArgs)).toContain("Free");
  });

  it("shows shipping fee amount when non-zero", () => {
    const html = buildOrderConfirmationEmail({ ...confirmArgs, shippingFee: 60 });
    expect(html).toContain("60.00");
  });

  it("contains delivery address fields", () => {
    const html = buildOrderConfirmationEmail(confirmArgs);
    expect(html).toContain("Bengaluru");
    expect(html).toContain("Karnataka");
    expect(html).toContain("560001");
  });

  it("COD order mentions pay on delivery", () => {
    const html = buildOrderConfirmationEmail({ ...confirmArgs, isCod: true });
    expect(html.toLowerCase()).toContain("pay on delivery");
  });

  it("non-COD order does not mention pay on delivery", () => {
    const html = buildOrderConfirmationEmail({ ...confirmArgs, isCod: false });
    expect(html.toLowerCase()).not.toContain("pay on delivery");
  });
});

// ── buildDispatchEmail ────────────────────────────────────────────────────────

describe("buildDispatchEmail", () => {
  const base = {
    customerName: "Karthik",
    shortId: "ORD001",
    courier: "Delhivery",
    trackingNumber: "DL9876543210",
    trackingUrl: "https://track.delhivery.com/DL9876543210",
  };

  it("contains customer name", () => {
    expect(buildDispatchEmail(base)).toContain("Karthik");
  });

  it("contains order shortId", () => {
    expect(buildDispatchEmail(base)).toContain("ORD001");
  });

  it("contains courier name", () => {
    expect(buildDispatchEmail(base)).toContain("Delhivery");
  });

  it("renders tracking URL as anchor when provided", () => {
    expect(buildDispatchEmail(base)).toContain("https://track.delhivery.com/DL9876543210");
  });

  it("shows tracking number text when trackingUrl is null", () => {
    const html = buildDispatchEmail({ ...base, trackingUrl: null });
    expect(html).toContain("DL9876543210");
    expect(html).not.toContain("https://track.delhivery.com");
  });

  it("includes estimated delivery when provided", () => {
    const eta = new Date("2026-08-20");
    const html = buildDispatchEmail({ ...base, estimatedDelivery: eta });
    expect(html).toContain("20");
    expect(html.toLowerCase()).toContain("estimated delivery");
  });

  it("omits estimated delivery line when not provided", () => {
    const html = buildDispatchEmail({ ...base, estimatedDelivery: null });
    expect(html.toLowerCase()).not.toContain("estimated delivery");
  });
});

// ── buildDeliveredEmail ───────────────────────────────────────────────────────

describe("buildDeliveredEmail", () => {
  it("contains customer name", () => {
    expect(buildDeliveredEmail({ customerName: "Anitha", shortId: "ORD002" })).toContain("Anitha");
  });

  it("contains order shortId", () => {
    expect(buildDeliveredEmail({ customerName: "Anitha", shortId: "ORD002" })).toContain("ORD002");
  });

  it("mentions delivered", () => {
    const html = buildDeliveredEmail({ customerName: "Anitha", shortId: "ORD002" });
    expect(html.toLowerCase()).toContain("delivered");
  });

  it("includes shop again link", () => {
    expect(buildDeliveredEmail({ customerName: "Anitha", shortId: "ORD002" })).toContain("/product");
  });
});

// ── buildPaymentFailedAlert ───────────────────────────────────────────────────

describe("buildPaymentFailedAlert", () => {
  const args = {
    orderId: "clxyz00000000002",
    customerName: "Vikram",
    customerEmail: "vikram@example.com",
    total: 649,
  };

  it("contains truncated orderId uppercased", () => {
    expect(buildPaymentFailedAlert(args)).toContain("CLXYZ000");
  });

  it("contains customer name and email", () => {
    const html = buildPaymentFailedAlert(args);
    expect(html).toContain("Vikram");
    expect(html).toContain("vikram@example.com");
  });

  it("contains formatted total", () => {
    expect(buildPaymentFailedAlert(args)).toContain("649.00");
  });
});

// ── buildLowStockAlert ────────────────────────────────────────────────────────

describe("buildLowStockAlert", () => {
  const variants = [
    { productTitle: "Ragi Flakes", size: "500g", stock: 3, sku: "NAT-001-500" },
    { productTitle: "Foxtail Millet", size: "1kg", stock: 1, sku: "NAT-002-1000" },
  ];

  it("lists each product title", () => {
    const html = buildLowStockAlert({ variants });
    expect(html).toContain("Ragi Flakes");
    expect(html).toContain("Foxtail Millet");
  });

  it("shows stock counts", () => {
    const html = buildLowStockAlert({ variants });
    expect(html).toContain("3 left");
    expect(html).toContain("1 left");
  });

  it("shows SKUs", () => {
    const html = buildLowStockAlert({ variants });
    expect(html).toContain("NAT-001-500");
    expect(html).toContain("NAT-002-1000");
  });
});

// ── buildPasswordResetEmail ───────────────────────────────────────────────────

describe("buildPasswordResetEmail", () => {
  const resetUrl = "https://srilaya.com/admin/reset-password?token=abc123";

  it("contains the reset URL as an anchor href", () => {
    expect(buildPasswordResetEmail({ resetUrl })).toContain(resetUrl);
  });

  it("mentions 1 hour expiry", () => {
    expect(buildPasswordResetEmail({ resetUrl })).toContain("1 hour");
  });

  it("mentions reset password", () => {
    const html = buildPasswordResetEmail({ resetUrl });
    expect(html.toLowerCase()).toContain("reset");
  });
});

// ── buildAbandonedCartEmail ───────────────────────────────────────────────────

describe("buildAbandonedCartEmail", () => {
  const args = {
    items: [
      { title: "Barnyard Millet", size: "500g", quantity: 1 },
      { title: "Kodo Millet", size: "1kg", quantity: 2 },
    ],
    cartUrl: "https://srilaya.com/cart",
  };

  it("contains each item title", () => {
    const html = buildAbandonedCartEmail(args);
    expect(html).toContain("Barnyard Millet");
    expect(html).toContain("Kodo Millet");
  });

  it("contains the cart URL", () => {
    expect(buildAbandonedCartEmail(args)).toContain("https://srilaya.com/cart");
  });

  it("contains size and quantity info", () => {
    const html = buildAbandonedCartEmail(args);
    expect(html).toContain("500g");
    expect(html).toContain("× 2");
  });
});

// ── buildInStoreInvoiceEmail ──────────────────────────────────────────────────

const inStoreArgs = {
  customerName: "Lakshmi",
  orderId: "clxyz00000000003",
  invoiceNo: "INV-IS-001",
  items: [
    { title: "Ragi Flakes", size: "500g", quantity: 1, price: 149, gstRate: 5 },
  ],
  subtotal: 149,
  taxTotal: 7.45,
  total: 156.45,
  paymentMethod: "upi",
  phone: "9876543210",
  createdAt: new Date("2026-08-13T10:30:00"),
};

describe("buildInStoreInvoiceEmail", () => {
  it("contains customer name", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("Lakshmi");
  });

  it("contains truncated orderId", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("CLXYZ000");
  });

  it("contains invoice number", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("INV-IS-001");
  });

  it("contains item title", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("Ragi Flakes");
  });

  it("shows UPI as payment label", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("UPI");
  });

  it("shows total paid", () => {
    expect(buildInStoreInvoiceEmail(inStoreArgs)).toContain("156.45");
  });

  it("omits invoice number row when invoiceNo is null", () => {
    const html = buildInStoreInvoiceEmail({ ...inStoreArgs, invoiceNo: null });
    expect(html).not.toContain("INV-IS-001");
  });
});

// ── buildWhatsAppInvoiceText ──────────────────────────────────────────────────

const waArgs = {
  customerName: "Suresh",
  orderId: "clxyz00000000004",
  items: [
    { title: "Foxtail Millet", size: "500g", quantity: 2 },
  ],
  total: 298,
  paymentMethod: "cash",
  createdAt: new Date("2026-08-13T14:00:00"),
};

describe("buildWhatsAppInvoiceText", () => {
  it("contains customer name", () => {
    expect(buildWhatsAppInvoiceText(waArgs)).toContain("Suresh");
  });

  it("contains truncated orderId uppercased", () => {
    expect(buildWhatsAppInvoiceText(waArgs)).toContain("CLXYZ000");
  });

  it("contains item title and size", () => {
    const text = buildWhatsAppInvoiceText(waArgs);
    expect(text).toContain("Foxtail Millet");
    expect(text).toContain("500g");
  });

  it("contains formatted total", () => {
    expect(buildWhatsAppInvoiceText(waArgs)).toContain("298.00");
  });

  it("shows Cash as payment label", () => {
    expect(buildWhatsAppInvoiceText(waArgs)).toContain("Cash");
  });

  it("returns a plain text string (no HTML tags)", () => {
    const text = buildWhatsAppInvoiceText(waArgs);
    expect(text).not.toContain("<");
    expect(text).not.toContain(">");
  });

  it("falls back gracefully when paymentMethod is null", () => {
    const text = buildWhatsAppInvoiceText({ ...waArgs, paymentMethod: null });
    expect(text).toContain("In-Store");
  });
});
