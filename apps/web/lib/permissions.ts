export type AppRole = 'admin' | 'manager' | 'inventory_staff' | 'billing_staff' | 'customer';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin:           'System Admin',
  manager:         'Store Manager',
  inventory_staff: 'Inventory Staff',
  billing_staff:   'Billing Staff',
  customer:        'Customer',
};

/**
 * Each role lists the /admin path prefixes it can access.
 * A role with ['/admin'] can access everything under /admin.
 */
export const ROLE_ALLOWED_PATHS: Record<AppRole, string[]> = {
  admin:           ['/admin'],
  manager:         ['/admin'],
  inventory_staff: ['/admin/products', '/admin/categories', '/admin/suppliers'],
  billing_staff:   ['/admin/orders'],
  customer:        [],
};

export function canAccessPath(role: string, path: string): boolean {
  const allowed = ROLE_ALLOWED_PATHS[role as AppRole];
  if (!allowed || allowed.length === 0) return false;
  return allowed.some(prefix => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?'));
}

export function isAdminRole(role: string): boolean {
  return ['admin', 'manager', 'inventory_staff', 'billing_staff'].includes(role);
}
