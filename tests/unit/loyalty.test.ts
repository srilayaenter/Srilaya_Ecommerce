import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing loyalty functions
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    loyaltyAccount: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
  },
}));

import { getBalance, earnPoints, redeemPoints, processReferral } from "../../apps/web/lib/loyalty";
import { prisma } from "../../apps/web/lib/db";

const mockPrisma = prisma as {
  loyaltyAccount: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  order: { count: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getBalance ────────────────────────────────────────────────────────────────

describe("getBalance", () => {
  it("returns the balance when account exists", async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({ balance: 250 });
    expect(await getBalance("user@example.com")).toBe(250);
  });

  it("returns 0 when account does not exist", async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue(null);
    expect(await getBalance("new@example.com")).toBe(0);
  });

  it("queries by the correct email", async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({ balance: 100 });
    await getBalance("test@example.com");
    expect(mockPrisma.loyaltyAccount.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "test@example.com" } })
    );
  });
});

// ── earnPoints ────────────────────────────────────────────────────────────────

describe("earnPoints", () => {
  it("calls upsert when orderTotal generates points", async () => {
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});
    await earnPoints("user@example.com", "order-001", 500);
    expect(mockPrisma.loyaltyAccount.upsert).toHaveBeenCalledTimes(1);
  });

  it("does not call upsert when orderTotal is 0 (no points earned)", async () => {
    await earnPoints("user@example.com", "order-002", 0);
    expect(mockPrisma.loyaltyAccount.upsert).not.toHaveBeenCalled();
  });

  it("upsert create payload includes correct points for ₹500 order (0.1 per rupee = 50)", async () => {
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});
    await earnPoints("user@example.com", "order-003", 500);
    const call = mockPrisma.loyaltyAccount.upsert.mock.calls[0][0];
    expect(call.create.balance).toBe(50);
    expect(call.create.totalEarned).toBe(50);
  });

  it("upsert update payload increments balance by correct points", async () => {
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});
    await earnPoints("user@example.com", "order-004", 1000);
    const call = mockPrisma.loyaltyAccount.upsert.mock.calls[0][0];
    expect(call.update.balance).toEqual({ increment: 100 });
    expect(call.update.totalEarned).toEqual({ increment: 100 });
  });

  it("transaction note contains short uppercased orderId", async () => {
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});
    await earnPoints("user@example.com", "clxyz00000000001", 200);
    const call = mockPrisma.loyaltyAccount.upsert.mock.calls[0][0];
    expect(call.create.transactions.create.note).toContain("CLXYZ000");
  });
});

// ── redeemPoints ──────────────────────────────────────────────────────────────

describe("redeemPoints", () => {
  it("calls update with correct decrement", async () => {
    mockPrisma.loyaltyAccount.update.mockResolvedValue({});
    await redeemPoints("user@example.com", "order-005", 100);
    const call = mockPrisma.loyaltyAccount.update.mock.calls[0][0];
    expect(call.where).toEqual({ email: "user@example.com" });
    expect(call.data.balance).toEqual({ decrement: 100 });
  });

  it("transaction points is stored as negative value", async () => {
    mockPrisma.loyaltyAccount.update.mockResolvedValue({});
    await redeemPoints("user@example.com", "order-006", 50);
    const call = mockPrisma.loyaltyAccount.update.mock.calls[0][0];
    expect(call.data.transactions.create.points).toBe(-50);
  });

  it("transaction type is 'redeemed'", async () => {
    mockPrisma.loyaltyAccount.update.mockResolvedValue({});
    await redeemPoints("user@example.com", "order-007", 200);
    const call = mockPrisma.loyaltyAccount.update.mock.calls[0][0];
    expect(call.data.transactions.create.type).toBe("redeemed");
  });
});

// ── processReferral ───────────────────────────────────────────────────────────

describe("processReferral", () => {
  it("does nothing when customer already has a prior paid order", async () => {
    mockPrisma.order.count.mockResolvedValue(1);
    await processReferral("new@example.com", "REF123", "order-008");
    expect(mockPrisma.loyaltyAccount.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.loyaltyAccount.update).not.toHaveBeenCalled();
  });

  it("does nothing when referral code is not found", async () => {
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue(null);
    await processReferral("new@example.com", "BADCODE", "order-009");
    expect(mockPrisma.loyaltyAccount.update).not.toHaveBeenCalled();
  });

  it("does nothing when referrer email matches new customer (self-referral)", async () => {
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({
      id: "acc-001",
      email: "new@example.com", // same as new customer
    });
    await processReferral("new@example.com", "SELFREF", "order-010");
    expect(mockPrisma.loyaltyAccount.update).not.toHaveBeenCalled();
  });

  it("awards 50 points to referrer on valid first-order referral", async () => {
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({
      id: "acc-001",
      email: "referrer@example.com",
    });
    mockPrisma.loyaltyAccount.update.mockResolvedValue({});
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});

    await processReferral("new@example.com", "REF123", "order-011");

    const updateCall = mockPrisma.loyaltyAccount.update.mock.calls[0][0];
    expect(updateCall.data.balance).toEqual({ increment: 50 });
    expect(updateCall.data.totalEarned).toEqual({ increment: 50 });
  });

  it("awards 50 bonus points to new customer on valid referral", async () => {
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({
      id: "acc-001",
      email: "referrer@example.com",
    });
    mockPrisma.loyaltyAccount.update.mockResolvedValue({});
    mockPrisma.loyaltyAccount.upsert.mockResolvedValue({});

    await processReferral("new@example.com", "REF123", "order-012");

    const upsertCall = mockPrisma.loyaltyAccount.upsert.mock.calls[0][0];
    expect(upsertCall.create.balance).toBe(50);
    expect(upsertCall.update.balance).toEqual({ increment: 50 });
  });
});
