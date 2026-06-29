import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ROLE_LABELS, AppRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";

async function updateUserRole(formData: FormData) {
  'use server';
  const userId = formData.get('userId') as string;
  const role   = formData.get('role') as string;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  redirect('/admin/users?saved=true');
}

async function createStaffUser(formData: FormData) {
  'use server';
  const email    = (formData.get('email') as string).trim().toLowerCase();
  const password = formData.get('password') as string;
  const role     = formData.get('role') as string;
  const hash     = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Email exists — update role and password instead of creating a duplicate
    await prisma.user.update({
      where: { email },
      data: { role, password: hash },
    });
  } else {
    await prisma.user.create({ data: { email, password: hash, role } });
  }
  redirect('/admin/users?saved=true');
}

const STAFF_ROLES: AppRole[] = ['admin', 'manager', 'inventory_staff', 'billing_staff'];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Users &amp; Roles</h1>
          <p className="text-sm text-[#8D6E63] mt-1">Manage staff accounts and role-based access.</p>
        </div>
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

      {/* User table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
            <tr className="text-[11px] font-bold uppercase text-[#9E9E9E] tracking-wider">
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Current Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {users.map(user => (
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
                    <button
                      type="submit"
                      className="bg-[#006A38] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#00522B] transition-colors"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create or update staff account */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#212121] mb-1">Create or Update Staff Account</h2>
        <p className="text-xs text-[#8D6E63] mb-4">
          If the email already exists, the role and password will be updated instead.
        </p>
        <form action={createStaffUser} className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="staff@srilaya.com"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Role</label>
            <select
              name="role"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]"
            >
              {STAFF_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <button
              type="submit"
              className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[#00522B] transition-colors text-sm"
            >
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
    case 'manager':         return 'All pages except Store Settings and user promotion';
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
