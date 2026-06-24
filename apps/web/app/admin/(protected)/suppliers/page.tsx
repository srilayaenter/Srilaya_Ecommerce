import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

async function createSupplier(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  if (!name) return;

  await prisma.supplier.create({
    data: {
      name,
      contactPerson: (formData.get("contactPerson") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  redirect("/admin/suppliers");
}

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">
          Suppliers
        </h1>
        <p className="text-[#8D6E63] text-[14px] mt-1 font-medium">
          Manage who you purchase products from.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E0E0E0]">
            <h2 className="font-bold text-[#212121]">Existing Suppliers</h2>
          </div>
          <div className="divide-y divide-[#F5F5F5]">
            {suppliers.map((s) => (
              <Link
                key={s.id}
                href={`/admin/suppliers/${s.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#FFF8E1]/30 transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#212121] text-sm">{s.name}</p>
                  <p className="text-[#9E9E9E] text-xs mt-0.5">
                    {s.phone || s.email || "No contact info"}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#006A38] bg-[#006A38]/10 px-2.5 py-1 rounded-full">
                  {s._count.products} product{s._count.products !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
            {suppliers.length === 0 && (
              <p className="px-6 py-8 text-center text-[#9E9E9E] text-sm">
                No suppliers added yet.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-sm p-6">
          <h2 className="font-bold text-[#212121] mb-4">Add New Supplier</h2>
          <form action={createSupplier} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                Address
              </label>
              <textarea
                name="address"
                rows={2}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g. payment terms, delivery schedule"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#006A38] hover:bg-[#00522B] text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              Add Supplier
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}