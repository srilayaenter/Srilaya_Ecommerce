import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function updateSupplier(supplierId: string, formData: FormData) {
  "use server";
  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      name: formData.get("name") as string,
      contactPerson: (formData.get("contactPerson") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
      active: formData.get("active") === "on",
    },
  });
  redirect("/admin/suppliers");
}

export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { products: { select: { id: true, title: true } } },
  });

  if (!supplier) notFound();

  const updateWithId = updateSupplier.bind(null, supplier.id);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">
          Edit Supplier
        </h1>
        <Link href="/admin/suppliers" className="text-[#006A38] font-semibold text-sm hover:underline">
          ← Back to Suppliers
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-sm p-6">
          <form action={updateWithId} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={supplier.name}
                required
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                defaultValue={supplier.contactPerson || ""}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={supplier.phone || ""}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={supplier.email || ""}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Address</label>
              <textarea
                name="address"
                rows={2}
                defaultValue={supplier.address || ""}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={supplier.notes || ""}
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38] resize-none"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="active" defaultChecked={supplier.active} />
              <span className="text-sm font-medium text-[#212121]">Active</span>
            </label>
            <button
              type="submit"
              className="w-full bg-[#006A38] hover:bg-[#00522B] text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-sm p-6">
          <h2 className="font-bold text-[#212121] mb-4">
            Products from this Supplier ({supplier.products.length})
          </h2>
          {supplier.products.length === 0 ? (
            <p className="text-[#9E9E9E] text-sm">No products linked yet.</p>
          ) : (
            <ul className="space-y-2">
              {supplier.products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-sm text-[#006A38] hover:underline font-medium"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}