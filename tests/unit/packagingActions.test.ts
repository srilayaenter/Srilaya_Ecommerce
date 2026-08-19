import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockCreate, mockRevalidatePath } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockCreate: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: { packagingItem: { create: mockCreate } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { addPackagingItem } from "../../apps/web/app/admin/(protected)/packaging/actions";

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ id: "item1" });
});

describe("addPackagingItem — exact cost write protection", () => {
  it("owner-submitted costPerUnit is persisted", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "owner" } });
    await addPackagingItem(makeFormData({
      name: "Test Pouch", category: "pouch", costPerUnit: "3.50",
    }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ costPerUnit: 3.5 }),
    }));
  });

  it.each(["admin", "manager", "inventory_staff"])(
    "%s-submitted (crafted) costPerUnit is ignored, not persisted",
    async (role) => {
      mockGetServerSession.mockResolvedValue({ user: { id: "u1", role } });
      await addPackagingItem(makeFormData({
        name: "Test Pouch", category: "pouch", costPerUnit: "999.99",
      }));
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ costPerUnit: null }),
      }));
    }
  );

  it("non-cost fields still persist for a non-owner submission", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } });
    await addPackagingItem(makeFormData({
      name: "Test Pouch", category: "pouch", unit: "rolls",
      reorderThreshold: "25", notes: "test note",
    }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: "Test Pouch",
        category: "pouch",
        unit: "rolls",
        reorderThreshold: 25,
        notes: "test note",
        costPerUnit: null,
      }),
    }));
  });

  it("unauthenticated submission still creates the item without cost (unchanged operational access — this action has no session-existence gate, matching its pre-existing behavior for non-cost fields)", async () => {
    mockGetServerSession.mockResolvedValue(null);
    await addPackagingItem(makeFormData({ name: "Test Pouch", category: "pouch", costPerUnit: "50" }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ costPerUnit: null }),
    }));
  });
});
