import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({ storage: {}, from: vi.fn() }),
}));

import { createClient } from "@supabase/supabase-js";

// Re-import fresh each test by resetting the module cache
async function freshGetSupabaseAdmin() {
  vi.resetModules();
  const mod = await import("../../apps/web/lib/supabase");
  return mod.getSupabaseAdmin;
}

describe("STORAGE_BUCKET", () => {
  it("is 'media'", async () => {
    const { STORAGE_BUCKET } = await import("../../apps/web/lib/supabase");
    expect(STORAGE_BUCKET).toBe("media");
  });
});

describe("getSupabaseAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fn = await freshGetSupabaseAdmin();
    expect(() => fn()).toThrow("Supabase env vars not set");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fn = await freshGetSupabaseAdmin();
    expect(() => fn()).toThrow("Supabase env vars not set");
  });

  it("returns a client when both env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const fn = await freshGetSupabaseAdmin();
    const client = fn();
    expect(client).toBeTruthy();
  });

  it("calls createClient with the correct URL and key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    const fn = await freshGetSupabaseAdmin();
    fn();
    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key",
      expect.objectContaining({ auth: { persistSession: false } })
    );
  });
});
