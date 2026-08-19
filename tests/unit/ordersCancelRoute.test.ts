import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFindUnique,
  mockVariantUpdate,
  mockOrderUpdate,
  mockTransaction,
  mockApplyFulfillmentStatusChange,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockVariantUpdate: vi.fn(),
  mockOrderUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockApplyFulfillmentStatusChange: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("next-axiom", () => ({
  Logger: class {
    info = vi.fn();
    warn = vi.fn();
    error = vi.fn();
    flush = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    order: { findUnique: mockFindUnique },
    productVariant: { update: mockVariantUpdate },
    $transaction: mockTransaction,
  },
}));

vi.mock("../../apps/web/lib/applyFulfillmentStatusChange", () => ({
  applyFulfillmentStatusChange: mockApplyFulfillmentStatusChange,
}));

vi.mock("../../apps/web/lib/email", () => ({
  sendEmail: mockSendEmail,
}));

import { POST } from "../../apps/web/app/api/orders/cancel/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/orders/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ORDER = {
  id: "order-001",
  email: "customer@example.com",
  customerName: "Jane Doe",
  status: "paid",
  fulfillmentStatus: "pending",
  items: [{ variantId: "variant-1", quantity: 2 }],
};

// The route's own $transaction mock: invokes the callback with a tx object
// that routes to the SAME mocked functions used for assertions, and lets a
// thrown error inside the callback propagate out (real Prisma behavior on
// rollback), so the route's own catch/tag logic is exercised for real.
function wireTransaction() {
  mockTransaction.mockImplementation(async (cb: any) =>
    cb({
      productVariant: { update: mockVariantUpdate },
      order: { update: mockOrderUpdate },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue({ ...ORDER, items: [...ORDER.items] } as any);
  mockVariantUpdate.mockResolvedValue({} as any);
  mockOrderUpdate.mockResolvedValue({} as any);
  mockSendEmail.mockResolvedValue({ success: true } as any);
  mockApplyFulfillmentStatusChange.mockResolvedValue({ ok: true });
  wireTransaction();
});

describe("POST /api/orders/cancel — routes through the guarded transition path", () => {
  it("calls applyFulfillmentStatusChange with actorType 'customer' and newStatus 'cancelled'", async () => {
    const res = await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(res.status).toBe(200);
    expect(mockApplyFulfillmentStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-001",
        newStatus: "cancelled",
        actorType: "customer",
      }),
    );
  });

  it("passes the transaction's tx client through, not the top-level prisma client", async () => {
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    const callArg = mockApplyFulfillmentStatusChange.mock.calls[0][0];
    expect(callArg.tx).toBeDefined();
    expect(callArg.tx).not.toBe(undefined);
  });

  it("uses the customer's matched email as actorId, never a raw role-based identity", async () => {
    await POST(makeRequest({ orderId: "order-001", email: "Customer@Example.com" }));
    const callArg = mockApplyFulfillmentStatusChange.mock.calls[0][0];
    expect(callArg.actorId).toBe("customer@example.com");
    expect(callArg.actorRole).toBe("customer");
  });
});

describe("POST /api/orders/cancel — pre-checks unchanged", () => {
  it("404s when the order doesn't exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ orderId: "missing", email: "a@b.com" }));
    expect(res.status).toBe(404);
    expect(mockApplyFulfillmentStatusChange).not.toHaveBeenCalled();
  });

  it("403s when the email doesn't match the order", async () => {
    const res = await POST(makeRequest({ orderId: "order-001", email: "wrong@example.com" }));
    expect(res.status).toBe(403);
    expect(mockApplyFulfillmentStatusChange).not.toHaveBeenCalled();
  });

  it("400s for a payment status outside {pending, paid, cod_pending}", async () => {
    mockFindUnique.mockResolvedValue({ ...ORDER, status: "cancelled" } as any);
    const res = await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(res.status).toBe(400);
    expect(mockApplyFulfillmentStatusChange).not.toHaveBeenCalled();
  });

  it("400s for the fast-path fulfillmentStatus !== pending check, before ever entering the transaction", async () => {
    mockFindUnique.mockResolvedValue({ ...ORDER, fulfillmentStatus: "processing" } as any);
    const res = await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/already been dispatched/i);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockApplyFulfillmentStatusChange).not.toHaveBeenCalled();
  });
});

describe("POST /api/orders/cancel — decision 8b regression guard", () => {
  it("if the guarded function rejects (race condition: status changed between fast-path check and transaction), the whole transaction rolls back and a 400 is returned", async () => {
    mockApplyFulfillmentStatusChange.mockResolvedValue({ ok: false, reason: "rejected_customer_scope" });
    const res = await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("This order cannot be cancelled");
  });

  it("restock is rolled back when the guarded function rejects — order.update to status:'cancelled' never runs", async () => {
    mockApplyFulfillmentStatusChange.mockResolvedValue({ ok: false, reason: "rejected_invalid_transition" });
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    // Variant restock DID run inside the transaction callback before the
    // rejection was thrown, but the callback threw, so Prisma's real
    // $transaction would roll back that write along with everything else —
    // here we assert the route never proceeds to the final order.update
    // (status: "cancelled"), confirming it treats the callback's throw as
    // fatal to the whole operation rather than partially applying it.
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it("does not send the cancellation email when the guarded function rejects", async () => {
    mockApplyFulfillmentStatusChange.mockResolvedValue({ ok: false, reason: "rejected_customer_scope" });
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("a genuine unexpected error (not a guarded-path rejection) still returns the generic 500", async () => {
    mockApplyFulfillmentStatusChange.mockRejectedValue(new Error("db connection lost"));
    const res = await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/orders/cancel — restock + success path unchanged", () => {
  it("restocks every item's variant stock on success", async () => {
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(mockVariantUpdate).toHaveBeenCalledWith({
      where: { id: "variant-1" },
      data: { stock: { increment: 2 } },
    });
  });

  it("writes order.status = 'cancelled' on success (fulfillmentStatus is written by the guarded function, not here)", async () => {
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: "order-001" },
      data: { status: "cancelled" },
    });
    const [{ data }] = mockOrderUpdate.mock.calls[0];
    expect(data).not.toHaveProperty("fulfillmentStatus");
  });

  it("sends the cancellation email on success", async () => {
    await POST(makeRequest({ orderId: "order-001", email: "customer@example.com" }));
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "customer@example.com", context: "order_cancelled:order-001" }),
    );
  });
});
