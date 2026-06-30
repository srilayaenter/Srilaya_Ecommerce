import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toNum } from "@/lib/decimal";

export const metadata = { title: "Customers | Admin" };

const SEGMENT_STYLES: Record<string, string> = {
  "High Value":   "bg-purple-50 text-purple-700 border-purple-200",
  "Repeat Buyer": "bg-blue-50 text-blue-700 border-blue-200",
  "Bulk Buyer":   "bg-orange-50 text-orange-700 border-orange-200",
  "Inactive":     "bg-red-50 text-red-600 border-red-200",
  "New":          "bg-green-50 text-green-700 border-green-200",
};

function getSegments(orderCount: number, totalSpend: number, maxSingleOrder: number, daysSinceLast: number) {
  const tags: string[] = [];
  if (totalSpend >= 5000)     tags.push("High Value");
  if (orderCount >= 2)        tags.push("Repeat Buyer");
  if (maxSingleOrder >= 2000) tags.push("Bulk Buyer");
  if (daysSinceLast > 60)     tags.push("Inactive");
  if (orderCount === 1 && daysSinceLast <= 60) tags.push("New");
  return tags.length ? tags : ["New"];
}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!["admin", "manager"].includes(session?.user?.role ?? "")) redirect("/admin");

  const orders = await prisma.order.findMany({
    where: { status: { in: ["paid", "cod_pending"] }, email: { not: null } },
    select: {
      email: true, customerName: true, phone: true,
      total: true, createdAt: true, paymentMethod: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by email
  const customerMap = new Map<string, {
    name: string; phone: string | null; email: string;
    orders: number; totalSpend: number; maxOrder: number; lastOrder: Date;
  }>();

  for (const o of orders) {
    const key = o.email!.toLowerCase();
    const existing = customerMap.get(key);
    const amt = toNum(o.total);
    if (existing) {
      existing.orders++;
      existing.totalSpend += amt;
      existing.maxOrder = Math.max(existing.maxOrder, amt);
      if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
    } else {
      customerMap.set(key, {
        email: key,
        name: o.customerName ?? key,
        phone: o.phone,
        orders: 1,
        totalSpend: amt,
        maxOrder: amt,
        lastOrder: o.createdAt,
      });
    }
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const now = Date.now();
  const segmentCounts: Record<string, number> = {};
  customers.forEach(c => {
    const days = (now - c.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
    getSegments(c.orders, c.totalSpend, c.maxOrder, days).forEach(s => {
      segmentCounts[s] = (segmentCounts[s] ?? 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#212121] font-poppins">Customers</h1>
        <p className="text-sm text-[#757575] mt-0.5">Segments computed from order history</p>
      </div>

      {/* Segment summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(SEGMENT_STYLES).map(([seg, style]) => (
          <div key={seg} className={`rounded-2xl border px-4 py-3 text-center ${style}`}>
            <p className="text-2xl font-black">{segmentCounts[seg] ?? 0}</p>
            <p className="text-xs font-bold mt-0.5">{seg}</p>
          </div>
        ))}
      </div>

      {/* Customer table */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0]">
          <h2 className="font-black text-[#212121]">All Customers ({customers.length})</h2>
        </div>
        {customers.length === 0 ? (
          <div className="p-12 text-center text-[#9E9E9E]">No customers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F9] border-b border-[#F0F0F0]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Customer</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Orders</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Total Spent</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Last Order</th>
                  <th className="px-6 py-3 text-xs font-bold text-[#9E9E9E] uppercase">Segments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {customers.map(c => {
                  const daysSince = (now - c.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
                  const segs = getSegments(c.orders, c.totalSpend, c.maxOrder, daysSince);
                  return (
                    <tr key={c.email} className="hover:bg-[#FAFAFA]">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#212121]">{c.name}</p>
                        <p className="text-xs text-[#9E9E9E]">{c.email}</p>
                        {c.phone && <p className="text-xs text-[#9E9E9E]">{c.phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#212121]">{c.orders}</td>
                      <td className="px-6 py-4 text-right font-black text-[#006A38]">₹{c.totalSpend.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#757575] text-xs">
                        {c.lastOrder.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {segs.map(s => (
                            <span key={s} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEGMENT_STYLES[s]}`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
