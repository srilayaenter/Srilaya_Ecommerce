import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_LABELS, AppRole } from "@/lib/permissions";
import { issueActivationToken, buildActivationUrl } from "@/lib/staffActivation";
import { buildStaffActivationEmail } from "@/lib/emails/staffActivation";
import { sendEmail } from "@/lib/email";
import { logStaffActivationEvent } from "@/lib/logger";
import {
  ALLOWED_STAFF_ROLES,
  applyToggleUserActive,
  applyUpdateUserRole,
  applyResetPassword,
  applyCreateStaffUser,
} from "@/lib/userAdminActions";

// Only owner/admin may create staff accounts or (re)send activation links.
// Server actions on this page are also gated by middleware (only owner/admin
// can reach /admin/users at all), but we re-check here for defense in depth
// since server actions can be invoked directly.
async function requireOwnerOrAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "owner" && role !== "admin")) {
    throw new Error("Unauthorised");
  }
  return session;
}

const ALLOWED_ROLES = ALLOWED_STAFF_ROLES;
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
  const session = await getServerSession(authOptions);
  const userId = formData.get('userId') as string;
  const role   = formData.get('role') as string;
  const result = await applyUpdateUserRole({ actorRole: session?.user?.role, userId, role });
  if (!result.ok) return;
  redirect('/admin/users?saved=true');
}

async function toggleUserActive(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  const userId = formData.get('userId') as string;
  const active = formData.get('active') === 'true';
  const result = await applyToggleUserActive({ actorRole: session?.user?.role, userId, active });
  if (!result.ok) return;
  redirect('/admin/users?saved=true');
}

async function resetPassword(formData: FormData) {
  'use server';
  const session = await getServerSession(authOptions);
  const userId   = formData.get('userId') as string;
  const password = formData.get('newPassword') as string;
  const result = await applyResetPassword({ actorRole: session?.user?.role, userId, newPassword: password });
  if (!result.ok) return;
  redirect('/admin/users?saved=true');
}

async function createStaffUser(formData: FormData) {
  'use server';
  const session  = await getServerSession(authOptions);
  const email    = (formData.get('email') as string).trim().toLowerCase();
  const password = formData.get('password') as string;
  const role     = formData.get('role') as string;
  const result = await applyCreateStaffUser({ actorRole: session?.user?.role, email, password, role });
  if (!result.ok) return;
  redirect('/admin/users?saved=true');
}

async function inviteStaffUser(formData: FormData) {
  'use server';
  const session = await requireOwnerOrAdmin();

  const email = (formData.get('email') as string).trim().toLowerCase();
  const role  = formData.get('role') as string;
  if (!ALLOWED_ROLES.includes(role as AllowedRole) || role === 'customer') throw new Error('Invalid role');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, role, active: true } });
  } else {
    user = await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  const rawToken = await issueActivationToken(user.id);
  const activationUrl = buildActivationUrl(rawToken);
  const emailResult = await sendEmail({
    to: email,
    subject: 'Activate your SriLaYa staff account',
    html: buildStaffActivationEmail({ activationUrl }),
    context: `staff_activation:${user.id}`,
  });

  logStaffActivationEvent({
    userId: user.id,
    actorId: session.user.id,
    actorRole: session.user.role,
    result: emailResult.success ? 'issued' : 'email_delivery_failed',
  });

  redirect('/admin/users?saved=true');
}

async function resendActivation(formData: FormData) {
  'use server';
  const session = await requireOwnerOrAdmin();

  const userId = formData.get('userId') as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.email) throw new Error('User not found');

  const rawToken = await issueActivationToken(user.id);
  const activationUrl = buildActivationUrl(rawToken);
  const emailResult = await sendEmail({
    to: user.email,
    subject: 'Activate your SriLaYa staff account',
    html: buildStaffActivationEmail({ activationUrl }),
    context: `staff_activation:${user.id}`,
  });

  logStaffActivationEvent({
    userId: user.id,
    actorId: session.user.id,
    actorRole: session.user.role,
    result: emailResult.success ? 'issued' : 'email_delivery_failed',
  });

  redirect('/admin/users?saved=true');
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; reset?: string }> }) {
  const { saved, reset } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, role: true, active: true, password: true, createdAt: true },
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
              <th className="px-6 py-3 text-center">Active</th>
              <th className="px-6 py-3 text-right">Reset Password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {slotUsers.map(user => (
              <tr key={user.id} className={`transition-colors ${user.active ? 'hover:bg-[#FFF8E1]/20' : 'bg-red-50/40 hover:bg-red-50/60'}`}>
                <td className="px-6 py-4 text-sm font-bold text-[#212121]">
                  {SLOT_LABELS[user.email ?? ''] ?? user.email}
                  {!user.active && <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>}
                </td>
                <td className="px-6 py-4 text-xs text-[#9E9E9E] font-mono">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleBadgeClass(user.role)}`}>
                    {ROLE_LABELS[user.role as AppRole] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <form action={toggleUserActive}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="active" value={user.active ? 'false' : 'true'} />
                    <button
                      type="submit"
                      title={user.active ? 'Deactivate account' : 'Activate account'}
                      className={`w-10 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        user.active
                          ? 'bg-[#006A38] focus:ring-[#006A38]'
                          : 'bg-[#E0E0E0] focus:ring-[#9E9E9E]'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${user.active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </form>
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
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#9E9E9E]">
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
                  <td className="px-6 py-4 text-sm font-medium text-[#212121]">
                    {user.email}
                    {!user.password && <span className="ml-2 text-[10px] font-bold bg-[#FF9800]/10 text-[#E65100] px-1.5 py-0.5 rounded-full">Pending Activation</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleBadgeClass(user.role)}`}>
                      {ROLE_LABELS[user.role as AppRole] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#9E9E9E]">
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {!user.password && (
                        <form action={resendActivation}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button type="submit" className="bg-[#FF9800] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#F57C00] transition-colors whitespace-nowrap">
                            Resend Activation
                          </button>
                        </form>
                      )}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite staff via email activation (preferred) */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#212121] mb-1">Invite Staff (Email Activation)</h2>
        <p className="text-xs text-[#8D6E63] mb-4">Preferred way to add staff — they set their own password via a one-time link emailed to them. Link expires in 1 hour.</p>
        <form action={inviteStaffUser} className="grid grid-cols-3 gap-4" autoComplete="off">
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Email</label>
            <input type="email" name="email" required placeholder="staff@srilaya.com" autoComplete="off"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#616161] mb-1">Role</label>
            <select name="role" className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]">
              {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[#00522B] transition-colors text-sm w-full">
              Send Activation Link
            </button>
          </div>
        </form>
      </div>

      {/* Create ad-hoc staff account (emergency / fallback path — kept alongside activation) */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#212121] mb-1">Add Staff Account (Manual Password)</h2>
        <p className="text-xs text-[#8D6E63] mb-4">Emergency fallback for one-off accounts. Prefer the activation link above when possible. If the email already exists, its role and password will be overwritten.</p>
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
