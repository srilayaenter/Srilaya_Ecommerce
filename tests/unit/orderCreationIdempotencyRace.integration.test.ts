// Real-database concurrency test — deliberately NOT mocking apps/web/lib/db.
// This is the one place in this proposal's test suite that needs a genuine
// Postgres connection: the guarantee under test (the Order_cartId_live_unique
// partial index closing the multi-tab/concurrent-request race) is a property
// of Postgres's own constraint enforcement, which a mocked Prisma client
// cannot exercise. See docs/proposal-2-final-release-ready-plan-2026-08-20.md
// §5, which flags this as a new test category for this repo.
//
// Requires DATABASE_URL to point at a real database with the
// 20260819194746_add_order_cartid_live_unique migration applied (local dev
// DB during this implementation). Skips itself if no DATABASE_URL is set, so
// it doesn't fail CI environments that only run the mocked unit suite.
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const hasDb = !!process.env.DATABASE_URL;
const d = hasDb ? describe : describe.skip;

d("createOrder — real-DB concurrency race (Order_cartId_live_unique)", () => {
  let prisma: any;
  let categoryId: string;
  let productId: string;
  let variantId: string;
  let cartId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();

    const category = await prisma.category.create({
      data: { slug: `idem-test-cat-${Date.now()}`, name: "Idempotency Test Category" },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        slug: `idem-test-product-${Date.now()}`,
        title: "Idempotency Test Product",
        gstRate: 5,
        sku: `IDEM-TEST-${Date.now()}`,
        categoryId,
      },
    });
    productId = product.id;

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size: "200g",
        price: 100,
        stock: 5,
        sku: `IDEM-TEST-VAR-${Date.now()}`,
      },
    });
    variantId = variant.id;

    const cart = await prisma.cart.create({ data: { userId: null } });
    cartId = cart.id;

    await prisma.cartItem.create({
      data: { cartId, variantId, quantity: 1, price: 100, gstRate: 5 },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cart.delete({ where: { id: cartId } }).catch(() => {});
    await prisma.productVariant.delete({ where: { id: variantId } }).catch(() => {});
    await prisma.product.delete({ where: { id: productId } }).catch(() => {});
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("allows exactly one live order to be created when N concurrent attempts race for the same cart", async () => {
    const N = 10;

    // Mirrors the core of createOrder's transaction (stock decrement +
    // Order insert) directly — not calling the server action itself, since
    // that also touches cookies()/redirect()/session/email side effects
    // that are already covered by the mocked unit tests. This isolates the
    // exact guarantee under test: the database constraint's behavior under
    // real concurrency.
    async function attempt() {
      try {
        return await prisma.$transaction(async (tx: any) => {
          const dec = await tx.productVariant.updateMany({
            where: { id: variantId, stock: { gte: 1 } },
            data: { stock: { decrement: 1 } },
          });
          if (dec.count === 0) throw new Error("INSUFFICIENT_STOCK");

          const order = await tx.order.create({
            data: {
              customerName: "Race Test",
              subtotal: 100,
              taxTotal: 5,
              shippingFee: 0,
              total: 105,
              currency: "INR",
              status: "pending",
              orderChannel: "online",
              paymentMethod: "online",
              cartId,
            },
          });
          return { ok: true, orderId: order.id };
        });
      } catch (err: any) {
        return { ok: false, code: err?.code, target: err?.meta?.target };
      }
    }

    const results = await Promise.all(Array.from({ length: N }, () => attempt()));

    const succeeded = results.filter((r) => r.ok) as { ok: true; orderId: string }[];
    const conflicted = results.filter(
      (r) => !r.ok && (r as any).code === "P2002" &&
        String((r as any).target ?? "").includes("cartId"),
    );

    succeeded.forEach((r) => createdOrderIds.push(r.orderId));

    expect(succeeded).toHaveLength(1);
    expect(conflicted).toHaveLength(N - 1);

    const liveOrders = await prisma.order.findMany({
      where: { cartId, status: { in: ["pending", "cod_pending"] } },
    });
    expect(liveOrders).toHaveLength(1);

    // The N-1 losing transactions' stock decrements must have rolled back —
    // only the one winning order's decrement should be reflected.
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(variant.stock).toBe(4); // started at 5, exactly one decrement of 1 survives
  });
});
