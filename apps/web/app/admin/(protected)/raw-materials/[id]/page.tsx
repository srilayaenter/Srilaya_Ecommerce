import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOwner } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateRawMaterial, adjustStock } from "../actions";
import DeleteMaterialButton from "./DeleteMaterialButton";
import { Package, Factory, PencilSimple, Warning, CheckCircle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function RawMaterialDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const { id } = await params;

  const material = await prisma.rawMaterial.findUnique({
    where: { id },
    include: {
      stockLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      recipeLines: { include: { recipe: { include: { variant: { include: { product: { select: { title: true } } } } } } } },
    },
  });

  if (!material) notFound();

  const isLow        = material.stockQty <= material.reorderThreshold;
  const totalIn      = material.stockLogs.filter(l => l.qty > 0).reduce((s, l) => s + l.qty, 0);
  const totalOut     = material.stockLogs.filter(l => l.qty < 0).reduce((s, l) => s + Math.abs(l.qty), 0);
  const usedInRecipes = material.recipeLines.length;

  function typeLabel(type: string) {
    const icons: Record<string, React.ReactNode> = {
      purchase:   <Package size={12} weight="regular" className="inline-block mr-1" />,
      production: <Factory size={12} weight="regular" className="inline-block mr-1" />,
      adjustment: <PencilSimple size={12} weight="regular" className="inline-block mr-1" />,
    };
    const labels: Record<string, string> = { purchase: 'Purchase', production: 'Production', adjustment: 'Adjustment' };
    return <>{icons[type]}{labels[type] ?? type}</>;
  }

  function typeColor(type: string) {
    return { purchase: 'text-green-700', production: 'text-blue-600', adjustment: 'text-amber-600' }[type] ?? 'text-[#424242]';
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/raw-materials" className="text-[#9E9E9E] hover:text-[#424242] text-sm">← Raw Materials</Link>
          </div>
          <h1 className="text-2xl font-bold text-[#212121] mt-1">{material.name}</h1>
          <p className="text-sm text-[#8D6E63] mt-0.5">Unit: {material.unit} · Used in {usedInRecipes} recipe(s)</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
          isLow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span className="inline-flex items-center gap-1">{isLow ? <Warning size={14} weight="regular" /> : <CheckCircle size={14} weight="regular" />}{isLow ? 'Low Stock' : 'In Stock'}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Stock',    value: `${material.stockQty.toFixed(2)} ${material.unit}`, color: isLow ? 'text-red-600' : 'text-[#006A38]' },
          { label: 'Reorder Threshold', value: `${material.reorderThreshold} ${material.unit}`,   color: 'text-[#424242]' },
          { label: 'Total Received',   value: `${totalIn.toFixed(2)} ${material.unit}`,           color: 'text-green-700' },
          { label: 'Total Consumed',   value: `${totalOut.toFixed(2)} ${material.unit}`,          color: 'text-blue-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-5">
            <p className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold font-mono mt-2 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col: Edit + Adjust stock */}
        <div className="space-y-5">

          {/* Edit details */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="font-bold text-[#212121] mb-4">Edit Details</h2>
            <form action={updateRawMaterial} className="space-y-4">
              <input type="hidden" name="id" value={material.id} />
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Name</label>
                <input name="name" required defaultValue={material.name}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Unit</label>
                <select name="unit" defaultValue={material.unit}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litre">litre</option>
                  <option value="nos">nos (pieces)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Cost per Unit (₹)</label>
                <input name="costPerUnit" type="number" step="0.01" min="0"
                  defaultValue={material.costPerUnit ?? ''}
                  placeholder="0.00"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Reorder Threshold</label>
                <input name="reorderThreshold" type="number" step="0.5" min="0"
                  defaultValue={material.reorderThreshold}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <button type="submit"
                className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-lg hover:bg-[#00522B] text-sm">
                Save Changes
              </button>
            </form>
          </div>

          {/* Stock adjustment */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="font-bold text-[#212121] mb-1">Adjust Stock</h2>
            <p className="text-xs text-[#9E9E9E] mb-4">Use for corrections, wastage write-offs, or counted stock reconciliation.</p>
            <form action={adjustStock} className="space-y-3">
              <input type="hidden" name="rawMaterialId" value={material.id} />
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">
                  New Stock Qty ({material.unit})
                </label>
                <input name="newQty" type="number" step="0.001" min="0"
                  defaultValue={material.stockQty}
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Reason</label>
                <input name="note" placeholder="e.g. Physical count, wastage, spillage"
                  className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>
              <button type="submit"
                className="w-full border border-[#006A38] text-[#006A38] font-bold py-2.5 rounded-lg hover:bg-[#F5F5F5] text-sm">
                Apply Adjustment
              </button>
            </form>
          </div>

          {/* Used in recipes */}
          {usedInRecipes > 0 && (
            <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6">
              <h2 className="font-bold text-[#212121] mb-3">Used In Recipes</h2>
              <div className="space-y-2">
                {material.recipeLines.map(rl => (
                  <div key={rl.id} className="flex justify-between text-sm">
                    <span className="text-[#424242]">
                      {rl.recipe.variant.product.title} ({rl.recipe.variant.size})
                    </span>
                    <span className="font-mono text-[#006A38] font-bold">
                      {rl.qtyPerYield.toFixed(3)} {material.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <h2 className="font-bold text-red-700 mb-1">Danger Zone</h2>
            <p className="text-xs text-[#9E9E9E] mb-4">
              Permanently deletes this material, all stock logs, and removes it from any recipes.
            </p>
            <DeleteMaterialButton id={material.id} name={material.name} />
          </div>
        </div>

        {/* Right col: Stock history */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h2 className="font-bold text-[#212121]">Stock Movement History</h2>
            <span className="text-xs text-[#9E9E9E]">Last {material.stockLogs.length} entries</span>
          </div>

          {material.stockLogs.length === 0 ? (
            <p className="text-sm text-[#9E9E9E] px-6 py-10 text-center">No stock movements yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Date & Time</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-right">Change</th>
                  <th className="px-5 py-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {material.stockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-5 py-3 text-[#9E9E9E] text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                      <span className="ml-1">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className={`px-5 py-3 font-medium text-xs ${typeColor(log.type)}`}>
                      {typeLabel(log.type)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${log.qty >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {log.qty >= 0 ? '+' : ''}{log.qty.toFixed(3)} {material.unit}
                    </td>
                    <td className="px-5 py-3 text-[#9E9E9E] text-xs">{log.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
