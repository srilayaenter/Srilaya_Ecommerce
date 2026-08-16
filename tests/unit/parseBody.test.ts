import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody } from "../../apps/web/lib/validation";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, contentType = "application/json"): Request {
  return new Request("https://example.com/api/test", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

function makeMalformedRequest(raw: string): Request {
  return new Request("https://example.com/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
}

const SampleSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().positive(),
});

// ── success path ──────────────────────────────────────────────────────────────

describe("parseBody — success", () => {
  it("returns ok:true with parsed data on valid input", async () => {
    const req = makeRequest({ name: "Priya", age: 25 });
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Priya");
      expect(result.data.age).toBe(25);
    }
  });

  it("strips unknown fields (Zod strip mode)", async () => {
    const req = makeRequest({ name: "Priya", age: 25, extra: "ignored" });
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.data as Record<string, unknown>).extra).toBeUndefined();
    }
  });

  it("works with a string-only schema", async () => {
    const schema = z.object({ code: z.string().length(6) });
    const result = await parseBody(makeRequest({ code: "123456" }), schema);
    expect(result.ok).toBe(true);
  });
});

// ── validation failure ────────────────────────────────────────────────────────

describe("parseBody — schema validation failure", () => {
  it("returns ok:false with status 400 on invalid data", async () => {
    const req = makeRequest({ name: "", age: 25 });
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("includes Zod error messages in the error string", async () => {
    const req = makeRequest({ name: "Priya", age: -5 });
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("returns ok:false when a required field is missing", async () => {
    const req = makeRequest({ name: "Priya" }); // missing age
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("returns ok:false when body is an empty object against a required schema", async () => {
    const result = await parseBody(makeRequest({}), SampleSchema);
    expect(result.ok).toBe(false);
  });

  it("joins multiple Zod errors with semicolons", async () => {
    // both name and age are invalid
    const req = makeRequest({ name: "", age: -1 });
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(";");
    }
  });
});

// ── malformed JSON ─────────────────────────────────────────────────────────────

describe("parseBody — malformed JSON", () => {
  it("returns ok:false with 'Invalid JSON body' for unparseable input", async () => {
    const req = makeMalformedRequest("not json at all {{{{");
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid JSON body");
      expect(result.status).toBe(400);
    }
  });

  it("returns ok:false for an empty body string", async () => {
    const req = makeMalformedRequest("");
    const result = await parseBody(req, SampleSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("returns ok:false for a bare number body (not an object)", async () => {
    const req = makeMalformedRequest("42");
    const result = await parseBody(req, SampleSchema);
    // 42 is valid JSON but fails the object schema
    expect(result.ok).toBe(false);
  });
});
