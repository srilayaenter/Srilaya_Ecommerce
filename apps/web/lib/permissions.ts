export type AppRole = 'owner' | 'admin' | 'manager' | 'inventory_staff' | 'billing_staff' | 'customer';

export const ROLE_LABELS: Record<AppRole, string> = {
  owner:           'Business Owner',
  admin:           'System Admin',
  manager:         'Store Manager',
  inventory_staff: 'Inventory Staff',
  billing_staff:   'Billing Staff',
  customer:        'Customer',
};

/**
 * Each role lists the /admin path prefixes it can access.
 * A sole ['/admin'] entry grants unrestricted admin access.
 * All other entries are prefix-matched (sub-paths included), except '/admin'
 * which is exact-match only when it appears alongside other entries.
 */
export const ROLE_ALLOWED_PATHS: Record<AppRole, string[]> = {
  owner:   ['/admin'],
  admin:   ['/admin'],
  // Manager: all operational pages; excluded: /admin/users, /admin/settings,
  //          /admin/raw-materials, /admin/production, /admin/reports/pl (owner-only)
  manager: [
    '/admin',
    '/admin/orders',
    '/admin/products',
    '/admin/inventory-import',
    '/admin/stock-log',
    '/admin/categories',
    '/admin/suppliers',
    '/admin/purchase-orders',
    '/admin/reviews',
    '/admin/returns',
    '/admin/coupons',
    '/admin/bundles',
    '/admin/analytics',
    '/admin/gst-report',
    '/admin/loyalty',
    '/admin/customers',
    '/admin/blog',
    '/admin/failed-emails',
    '/admin/mfa-setup',
    '/admin/mfa-verify',
    '/admin/ops-app',
    // API paths backing the pages above — middleware's canAccessPath gates
    // /api/admin/:path* the same as /admin/:path*, so a page path alone does
    // not authorize the API calls that page's own UI makes. Each entry below
    // pairs with a page path already listed above for this role (Phase B
    // audit, 2026-08-19).
    '/api/admin/inventory/import',
    '/api/admin/inventory/export',
    '/api/admin/blog',
    '/api/admin/gst-report',
    '/api/admin/orders',
    '/api/admin/ops-app-download',
    '/api/admin/purchase-orders',
    '/api/admin/suppliers',
    '/api/admin/stock-log',
    '/api/admin/products',
    '/api/admin/upload',
    '/api/admin/products-for-order',
    '/api/admin/returns',
    '/api/admin/reviews',
    '/api/admin/coupons',
    '/api/admin/bundles',
    '/api/admin/variants',
  ],
  inventory_staff: [
    '/admin/products',
    '/admin/inventory-import',
    '/admin/stock-log',
    '/admin/categories',
    '/admin/suppliers',
    '/admin/purchase-orders',
    '/admin/mfa-setup',
    '/admin/mfa-verify',
    // See the comment on manager's API-path entries above — same rationale.
    '/api/admin/inventory/import',
    '/api/admin/inventory/export',
    '/api/admin/purchase-orders',
    '/api/admin/suppliers',
    '/api/admin/stock-log',
    '/api/admin/products',
    '/api/admin/upload',
    '/api/admin/variants',
  ],
  billing_staff: [
    '/admin/orders',
    '/admin/mfa-setup',
    '/admin/mfa-verify',
    // See the comment on manager's API-path entries above — same rationale.
    '/api/admin/orders',
    '/api/admin/products-for-order',
  ],
  customer: [],
};

export function canAccessPath(role: string, path: string): boolean {
  const allowed = ROLE_ALLOWED_PATHS[role as AppRole];
  if (!allowed || allowed.length === 0) return false;
  // Sole '/admin' entry = unrestricted access to everything under /admin
  if (allowed.length === 1 && allowed[0] === '/admin') return true;
  return allowed.some(prefix => {
    // '/admin' alongside other entries = exact root match only (not a wildcard)
    if (prefix === '/admin') return path === '/admin';
    return path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?');
  });
}

export function isAdminRole(role: string): boolean {
  return ['owner', 'admin', 'manager', 'inventory_staff', 'billing_staff'].includes(role);
}

export function isOwner(role: string): boolean {
  return role === 'owner';
}

// requirePathAccess — thin wrapper over canAccessPath, for pages/routes whose
// intended restriction is exactly what ROLE_ALLOWED_PATHS already encodes.
// Prefer this over a hand-copied role array: it can never drift from the
// central model, since there's only one place left to edit.
export function requirePathAccess(role: string, path: string): boolean {
  return canAccessPath(role, path);
}

// requireExactRoles — for pages/routes with an INTENTIONALLY stricter
// restriction than the path-list model (e.g. P&L, owner-only despite admin
// having unrestricted middleware access via the '/admin' wildcard). Does not
// consult ROLE_ALLOWED_PATHS at all — a role is allowed only if it's
// literally in allowedRoles.
export function requireExactRoles(role: string, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(role as AppRole);
}
