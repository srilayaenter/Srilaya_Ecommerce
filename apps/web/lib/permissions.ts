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
  ],
  billing_staff: [
    '/admin/orders',
    '/admin/mfa-setup',
    '/admin/mfa-verify',
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
