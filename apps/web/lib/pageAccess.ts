// owner has unrestricted /admin access everywhere else (middleware's
// ROLE_ALLOWED_PATHS.owner = ['/admin']) and is shown these nav items — these
// pages' own checks previously omitted "owner" by mistake, locking the owner
// out of pages they're supposed to see (same root cause already found and
// fixed for the GST report, PR #70).
export function isCustomersPageAllowed(role: string | null | undefined): boolean {
  return ["owner", "admin", "manager"].includes(role ?? "");
}

export function isLoyaltyPageAllowed(role: string | null | undefined): boolean {
  return ["owner", "admin", "manager"].includes(role ?? "");
}
