import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetServerSession,
  mockAdminRateLimit,
  mockIssueToken,
  mockBuildUrl,
  mockSendEmail,
  mockLogEvent,
  mockUserFindUnique,
  mockUserCreate,
  mockUserUpdate,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockAdminRateLimit: vi.fn(),
  mockIssueToken: vi.fn(),
  mockBuildUrl: vi.fn(),
  mockSendEmail: vi.fn(),
  mockLogEvent: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("../../apps/web/lib/auth", () => ({ authOptions: {} }));
vi.mock("../../apps/web/lib/adminGuard", () => ({ adminRateLimit: mockAdminRateLimit }));
vi.mock("../../apps/web/lib/staffActivation", () => ({
  issueActivationToken: mockIssueToken,
  buildActivationUrl: mockBuildUrl,
}));
vi.mock("../../apps/web/lib/emails/staffActivation", () => ({
  buildStaffActivationEmail: () => "<html></html>",
}));
vi.mock("../../apps/web/lib/email", () => ({ sendEmail: mockSendEmail }));
vi.mock("../../apps/web/lib/logger", () => ({ logStaffActivationEvent: mockLogEvent }));
vi.mock("../../apps/web/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
      update: mockUserUpdate,
    },
  },
}));

import { POST } from "../../apps/web/app/api/admin/staff/activation/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/staff/activation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sessionFor(role: string | undefined) {
  if (!role) return null;
  return { user: { id: "actor-1", email: "actor@srilaya.com", role } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAdminRateLimit.mockReturnValue(null);
  mockIssueToken.mockResolvedValue("raw-token-value");
  mockBuildUrl.mockReturnValue("https://app.example.com/admin/activate?token=raw-token-value");
  mockSendEmail.mockResolvedValue({ success: true });
});

describe("POST /api/admin/staff/activation — authorization", () => {
  it.each(["owner", "admin"])("allows role=%s to issue an activation link", async (role) => {
    mockGetServerSession.mockResolvedValue(sessionFor(role));
    mockUserFindUnique.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });
    mockUserUpdate.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });

    const res = await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));
    expect(res.status).toBe(200);
  });

  it.each(["manager", "inventory_staff", "billing_staff", "customer"])(
    "rejects role=%s with 401",
    async (role) => {
      mockGetServerSession.mockResolvedValue(sessionFor(role));

      const res = await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));
      expect(res.status).toBe(401);
      expect(mockIssueToken).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    },
  );

  it("rejects an anonymous (no session) caller with 401", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));
    expect(res.status).toBe(401);
    expect(mockIssueToken).not.toHaveBeenCalled();
  });

  it("logs a rejected_unauthorised event for a disallowed role, without leaking secrets", async () => {
    mockGetServerSession.mockResolvedValue(sessionFor("billing_staff"));
    await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({ result: "rejected_unauthorised" }),
    );
  });
});

describe("POST /api/admin/staff/activation — rate limiting", () => {
  it("returns the adminRateLimit response when the actor is rate-limited", async () => {
    mockGetServerSession.mockResolvedValue(sessionFor("admin"));
    const limited = new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
    mockAdminRateLimit.mockReturnValue(limited);

    const res = await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));
    expect(res.status).toBe(429);
    expect(mockIssueToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/staff/activation — email delivery failure", () => {
  it("still creates the token but reports emailDelivered:false when sendEmail fails", async () => {
    mockGetServerSession.mockResolvedValue(sessionFor("admin"));
    mockUserFindUnique.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });
    mockUserUpdate.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });
    mockSendEmail.mockResolvedValue({ success: false, error: "Resend down" });

    const res = await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.emailDelivered).toBe(false);
    expect(mockIssueToken).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({ result: "email_delivery_failed" }),
    );
  });
});

describe("POST /api/admin/staff/activation — safe logging", () => {
  it("never logs the raw activation token or email delivery internals containing secrets", async () => {
    mockGetServerSession.mockResolvedValue(sessionFor("admin"));
    mockUserFindUnique.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });
    mockUserUpdate.mockResolvedValue({ id: "user-1", email: "staff@srilaya.com", role: "manager" });

    await POST(makeRequest({ email: "staff@srilaya.com", role: "manager" }));

    for (const call of mockLogEvent.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).not.toContain("raw-token-value");
    }
  });
});
