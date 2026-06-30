import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RUPEES_PER_POINT } from "@/lib/loyalty";

export const metadata = { title: "Loyalty Points | Admin" };

export default async function LoyaltyAdminPage() {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes(session?.user?.role ?? "")) redirect("/admin");

  const accounts = await prisma.loyaltyAccount.findMany({
    orderBy: { balance: "desc" },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    take: 100,
  });

  const totalPointsOutstanding = accounts.reduce((s, a) => s + a.balance, 0);
  const totalPointsEverEarned  = accounts.reduce((s, a) => s + a.totalEarned, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#212121] font-poppins">Loyalty Points</h1>
        <p className="text-sm text-[#757575] mt-0.5">1 point per ₹10 spent · 10 points = ₹1 discount</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
          <p className="text-3xl font-black text-[#006A38]">{accounts.length}</p>
          <p className="text-sm font-bold text-[#757575] mt-1">Members</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
          <p className="text-3xl font-black text-[#E65100]">{totalPointsOutstanding.toLocaleString()}</p>
          <p className="text-sm font-bold text-[#757575] mt-1">Points Outstanding</p>
          <p className="text-xs text-[#9E9E9E]">≈ ₹{(totalPointsOutstanding * RUPEES_PER_POINT).toFixed(2)} liability</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
          <p className="text-3xl font-black text-[#212121]">{totalPointsEverEarned.toLocaleString()}</p>
          <p className="text-sm font-bold text-[#757575] mt-1">Total Points Earned (all time)</p>
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0]">
          <h2 className="font-black text-[#212121]">All Accounts</h2>
        </div>
        {accounts.length === 0 ? (
          <div className="p-12 text-center text-[#9E9E9E]">No loyalty accounts yet. Points are earned after orders.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#F0F0F0]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Email</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Balance</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Worth</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Total Earned</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Recent Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-6 py-4 font-medium text-[#212121]">{acc.email}</td>
                    <td className="px-6 py-4 text-right font-black text-[#006A38]">{acc.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-[#757575]">₹{(acc.balance * RUPEES_PER_POINT).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-[#757575]">{acc.totalEarned.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {acc.transactions.map(t => (
                          <p key={t.id} className={`text-xs ${t.points > 0 ? "text-green-600" : "text-red-500"}`}>
                            {t.points > 0 ? "+" : ""}{t.points} — {t.note ?? t.type}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
