import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ROLE_LABELS, AppRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = ['customer', 'admin', 'manager', 'inventory_staff', 'billing_staff'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];
const STAFF_ROLES: AppRole[] = ['admin', 'manager', 'inventory_staff', 'billing_staff'];

// Friendly display names for named slot accounts
const SLOT_LABELS: Record<string, string> = {
  'sysadmin@srilayafoods.com':     'System Admin',
  'storemanager1@srilayafoods.com':'Store Manager 1',
  'storemanager2@srilayafoods.com':'Store Manager 2',
  'billing1@srilayafoods.com':     'Billing Staff 1',
  'billing2@srilayafoods.com':     'Billing Staff 2',
  'inventory1@srilayafoods.com':   'Inventory Staff 1',
  'inventory2@srilayafoods.com':   'Inventory Staff 2',
};

async function updateUserRole(formData: FormData) {
  'use server';
  const userId = formData.get('userId') as string;
  const role   = formData.get('role') as string;
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) throw new Error('Invalid role');
  await prisma.user.update({ where: { id: userId }, data: { role } });
  redirect('/admin/users?saved=true');
}

async function resetPassword(formData: FormData) {
  'use server';
  const userId   = formData.get('userId') as string;
  const password = formData.get('newPassword') as string;
  if (!password || password.length < 8) throw new Error('Password too short');
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
  redirect('/admin/users?saved=true');
}

async function createStaffUser(formData: FormData) {
  'use server';
  const email    = (formData.get('email') as string).trim().toLowerCase();
  const password = formData.get('password') as string;
  const role     = formData.get('role') as string;
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) throw new Error('Invalid role');
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role, password: hash } });
  } else {
    await prisma.user.create({ data: { email, password: hash, role } });
  }
  redirect('/admin/users?saved=true');
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; reset?: string }> }) {
  const { saved, reset } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  // Slot accounts first, then others
  const slotEmails = Object.keys(SLOT_LABELS);
  const slotUsers  = slotEmails.map(e => users.find(u => u.email === e)).filter(Boolean) as typeof users;
  const otherUsers = users.filter(u => !slotEmails.includes(u.email ?? '') && u.role !== 'owner');

  return (
    <div className="space-y-6 font-sans pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#212121]">Users &amp; Roles</h1>
        <p className="text-sm text-[#8D6E63] mt-1">Manage staff accounts and role-based access.</p>
      </div>

      {saved && (
        <div className="bg-[#006A38]/10 border border-[#006A38]/30 text-[#006A38] px-4 py-3 rounded-lg text-sm font-semibold">
          Changes saved successfully.
        </div>
      )}

      {/* Role legend */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#212121] mb-3">Role Permissions</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {STAFF_ROLES.map(r => (
            <div key={r} className="flex items-start gap-2 p-3 bg-[#F5F5F5] rounded-lg">
              <span className="font-bold text-[#006A38] w-36 shrink-0">{ROLE_LABELS[r]}</span>
              <span className="text-[#616161]">{roleDescription(r)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Named slot accounts */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#212121]">Staff Slots</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">When someone leaves — reset the password and hand credentials to the new person.</p>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
            <tr className="text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
              <th className="px-6 py-3">Slot</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-right">Reset Password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {slotUsers.map(user => (
              <tr key={user.id} className="hover:bg-[#FFF8E1]/20 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-[#212121]">
                  {SLOT_LABELS[user.email ?? ''] ?? user.email}
                </td>
                <td className="px-6 py-4 text-xs text-[#9E9E9E] font-mono">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleBadgeClass(user.role)}`}>
                    {ROLE_LABELS[user.role as AppRole] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <form action={resetPassword} className="flex items-center gap-2 justify-end">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="password"
                      name="newPassword"
                      required
                      minLength={8}
                      placeholder="New password"
                      className="border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-sm w-36 focus:outline-none focus:border-[#006A38]"
                    />
                    <button
                      type="submit"
                      className="bg-[#FF9800] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#F57C00] transition-colors whitespace-nowrap"
                    >
                      Reset
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {slotUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#9E9E9E]">
                  No staff slot accounts found. Run the seed script to create them.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Other users */}
      {otherUsers.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0F0F0]">
            <h2 className="text-sm font-bold text-[#212121]">Other Users</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
              <tr className="text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {otherUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#FFF8E1]/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#212121]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleBadgeClass(user.role)}`}>
                      {ROLE_LABELS[user.role as AppRole] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#9E9E9E]">
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={updateUserRole} className="flex items-center gap-2 justify-end">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="border border-[#E0E0E0] rounded-lg px-2 py-1.5 text-sm bg-white text-[#424242] focus:outline-none focus:border-[#006A38]"
                      >
                        <option value="customer">Customer</option>
                        {STAFF_ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <button type="submit" className="bg-[#006A38] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#00522B] transition-colors">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create ad-hoc staff account */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#212121] mb-1">Add Staff Account</h2>
        <p className="text-xs text-[#8D6E63] mb-4">For one-off accounts outside the named slots. If the email already exists, its role and password will be overwritten.</p>
        <form action={createStaffUser} className="grid grid-cols-3 gap-4" autoComplete="off">
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Email</label>
            <input type="email" name="email" required placeholder="staff@srilaya.com" autoComplete="off"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Password</label>
            <input type="password" name="password" required minLength={8} placeholder="Min 8 characters" autoComplete="new-password"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Role</label>
            <select name="role" className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]">
              {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <button type="submit" className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[#00522B] transition-colors text-sm">
              Save Staff Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function roleDescription(role: AppRole): string {
  switch (role) {
    case 'admin':           return 'Full access — all settings, users, and data';
    case 'manager':         return 'All operational pages — cannot manage users or store settings';
    case 'inventory_staff': return 'Products, Categories, Suppliers only';
    case 'billing_staff':   return 'Orders page only';
    default:                return '';
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':           return 'bg-[#006A38]/10 text-[#006A38]';
    case 'manager':         return 'bg-[#2196F3]/10 text-[#1976D2]';
    case 'inventory_staff': return 'bg-[#FF9800]/10 text-[#E65100]';
    case 'billing_staff':   return 'bg-[#9C27B0]/10 text-[#6A1B9A]';
    default:                return 'bg-[#F5F5F5] text-[#616161]';
  }
}
