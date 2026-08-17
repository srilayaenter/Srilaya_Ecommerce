import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Static inspection of the root package.json's deployment scripts only —
// never invokes prisma, never touches any database or process.env.

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8"));

describe("vercel-build script — migration-before-build ordering", () => {
  it("defines a vercel-build script", () => {
    expect(typeof pkg.scripts["vercel-build"]).toBe("string");
  });

  it("gates the migration step to the production environment via VERCEL_ENV", () => {
    expect(pkg.scripts["vercel-build"]).toContain('"$VERCEL_ENV" = "production"');
  });

  it("runs prisma migrate deploy against the correct schema path before the build", () => {
    const script: string = pkg.scripts["vercel-build"];
    const migrateIdx = script.indexOf("prisma migrate deploy --schema=./packages/db/schema.prisma");
    const buildIdx = script.indexOf("pnpm run build");
    expect(migrateIdx).toBeGreaterThan(-1);
    expect(buildIdx).toBeGreaterThan(-1);
    expect(migrateIdx).toBeLessThan(buildIdx);
  });

  it("chains the migration step and the build with && so a migration failure stops the build", () => {
    const script: string = pkg.scripts["vercel-build"];
    // The conditional block must be followed by `&& pnpm run build`, not `;` or `||` —
    // `&&` is what makes a non-zero migrate-deploy exit short-circuit the build.
    expect(script).toMatch(/fi\s*&&\s*pnpm run build/);
  });

  it("does not run the migration step outside of the conditional (no unconditional migrate deploy)", () => {
    const script: string = pkg.scripts["vercel-build"];
    const unconditionalMigrate = script
      .replace(/if \[.*?\];\s*then\s*prisma migrate deploy[^;]*;\s*fi/, "");
    expect(unconditionalMigrate).not.toContain("prisma migrate deploy");
  });

  it("preserves the existing build script unchanged", () => {
    expect(pkg.scripts.build).toBe(
      "prisma generate --schema=./packages/db/schema.prisma && next build apps/web",
    );
  });

  it("vercel-build delegates to the existing build script rather than duplicating it", () => {
    expect(pkg.scripts["vercel-build"]).toContain("pnpm run build");
  });
});
