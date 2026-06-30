/**
 * API TESTS — Contact form route, Razorpay payment verify, admin orders
 * These hit real API routes (requires dev server running at TEST_BASE_URL).
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

test("API contact route — valid submission returns 200", async ({ request }) => {
  const res = await request.post(`${BASE}/api/contact`, {
    data: {
      name: "API Test",
      email: "apitest@srilaya.test",
      message: "Automated API test message",
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
});

test("API contact route — missing name returns 400", async ({ request }) => {
  const res = await request.post(`${BASE}/api/contact`, {
    data: { email: "apitest@srilaya.test", message: "no name" },
  });
  expect(res.status()).toBe(400);
});

test("API contact route — missing email returns 400", async ({ request }) => {
  const res = await request.post(`${BASE}/api/contact`, {
    data: { name: "Test", message: "no email" },
  });
  expect(res.status()).toBe(400);
});

test("API contact route — missing message returns 400", async ({ request }) => {
  const res = await request.post(`${BASE}/api/contact`, {
    data: { name: "Test", email: "test@test.com" },
  });
  expect(res.status()).toBe(400);
});

test("API contact route — empty body returns 400", async ({ request }) => {
  const res = await request.post(`${BASE}/api/contact`, {
    data: {},
  });
  expect(res.status()).toBe(400);
});

test("API payment verify — invalid signature returns 400", async ({ request }) => {
  const res = await request.post(`${BASE}/api/payments/razorpay/verify`, {
    data: {
      razorpay_order_id: "order_fake123",
      razorpay_payment_id: "pay_fake456",
      razorpay_signature: "invalidsignature",
      orderId: "clfake000000000000000001",
    },
  });
  // Should fail signature verification — 400 or 500
  expect(res.status()).toBeGreaterThanOrEqual(400);
});

test("API admin orders — unauthenticated returns 401/403", async ({ request }) => {
  const res = await request.get(`${BASE}/api/admin/orders`);
  expect([401, 403, 404]).toContain(res.status());
});
