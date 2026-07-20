#!/usr/bin/env node
/**
 * Maps a list of changed file paths to the relevant Playwright test specs.
 * Outputs GitHub Actions step output lines: run_full and test_specs.
 *
 * Usage: node scripts/ci/get-test-specs.js "$CHANGED_FILES"
 *   where CHANGED_FILES is a newline-separated list of paths from git diff.
 */

const changed = (process.argv[2] || '').split('\n').filter(Boolean);

// Patterns that map file changes to test spec files.
// Order matters: more specific patterns first.
const MAPPINGS = [
  // Shared DB schema/migrations → always full suite (handled by caller, but listed for completeness)
  { pattern: /packages\/db\/(schema\.prisma|migrations\/)/, full: true },

  // Shared lib/components → full suite (affects everything)
  { pattern: /apps\/web\/lib\/|apps\/web\/components\/Header|apps\/web\/components\/Footer/, full: true },

  // Auth routes
  {
    pattern: /apps\/web\/app\/(admin\/login|login|auth|api\/auth)\//,
    specs: ['tests/e2e/auth.spec.ts'],
  },

  // Contact form
  {
    pattern: /apps\/web\/app\/(api\/contact|\(shop\)\/contact|shop\/contact)\//,
    specs: ['tests/e2e/api/contact.spec.ts', 'tests/e2e/contact-blog-legal.spec.ts'],
  },

  // Checkout / payments
  {
    pattern: /apps\/web\/app\/(\(shop\)\/checkout|shop\/checkout|api\/payments)\//,
    specs: ['tests/e2e/checkout.spec.ts', 'tests/e2e/session-jul17.spec.ts'],
  },

  // Cart
  {
    pattern: /apps\/web\/app\/(\(shop\)\/cart|shop\/cart|api\/cart)\//,
    specs: ['tests/e2e/cart.spec.ts'],
  },

  // Products (storefront + admin)
  {
    pattern: /apps\/web\/app\/(\(shop\)\/product|shop\/product|admin\/products)\//,
    specs: ['tests/e2e/products.spec.ts', 'tests/e2e/admin.spec.ts'],
  },

  // Orders (admin)
  {
    pattern: /apps\/web\/app\/admin\/orders\//,
    specs: ['tests/e2e/orders.spec.ts', 'tests/e2e/admin.spec.ts', 'tests/e2e/session-jul17.spec.ts'],
  },

  // Raw materials
  {
    pattern: /apps\/web\/app\/admin\/raw-materials\//,
    specs: ['tests/e2e/raw-materials-production.spec.ts'],
  },

  // Packaging
  {
    pattern: /apps\/web\/app\/admin\/packaging\//,
    specs: ['tests/e2e/session-jul17.spec.ts'],
  },

  // Blog / recipes / legal
  {
    pattern: /apps\/web\/app\/(\(shop\)\/blog|shop\/blog|\(shop\)\/recipes|shop\/recipes|\(shop\)\/legal|shop\/legal)\//,
    specs: ['tests/e2e/contact-blog-legal.spec.ts'],
  },

  // Account / wishlist
  {
    pattern: /apps\/web\/app\/(\(shop\)\/account|shop\/account|api\/wishlist|api\/loyalty)\//,
    specs: ['tests/e2e/account-wishlist-loyalty.spec.ts'],
  },

  // Homepage / navigation (broad impact)
  {
    pattern: /apps\/web\/app\/(\(shop\)\/page\.tsx|layout\.tsx)/,
    specs: ['tests/e2e/smoke.spec.ts', 'tests/e2e/navigation-seo.spec.ts', 'tests/e2e/mobile.spec.ts'],
  },

  // Admin catch-all
  {
    pattern: /apps\/web\/app\/admin\//,
    specs: ['tests/e2e/admin.spec.ts'],
  },

  // Any API route → regression
  {
    pattern: /apps\/web\/app\/api\//,
    specs: ['tests/e2e/regression.spec.ts'],
  },

  // Session-specific test files (jul17/jul18-19 tests cover COD, packaging, etc.)
  {
    pattern: /apps\/web\/app\/(\(shop\)|admin)\/(bundles|recipes|packaging)\//,
    specs: ['tests/e2e/session-jul17.spec.ts', 'tests/e2e/session-jul18-19.spec.ts'],
  },
];

let runFull = false;
const specSet = new Set(['tests/e2e/smoke.spec.ts']); // always include smoke as baseline

for (const file of changed) {
  for (const mapping of MAPPINGS) {
    if (mapping.pattern.test(file)) {
      if (mapping.full) {
        runFull = true;
        break;
      }
      mapping.specs.forEach(s => specSet.add(s));
    }
  }
  if (runFull) break;
}

if (runFull) {
  console.log('run_full=true');
  console.log('test_specs=');
} else {
  console.log('run_full=false');
  console.log('test_specs=' + [...specSet].join(' '));
}
