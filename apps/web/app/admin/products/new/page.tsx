import { prisma } from "../../../../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

// 1. SERVER ACTION: SECURE PRODUCT CREATION
async function createProduct(formData: FormData) {
  'use server';

  // Extract core product data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const categoryId = formData.get('categoryId') as string;
  const isFeatured = formData.get('isFeatured') === 'on';
  const isActive = formData.get('isActive') === 'on';

  // Extract organic & storage metadata
  const certification = formData.get('certification') as string;
  const shelfLife = formData.get('shelfLife') as string;
  const storageDetails = formData.get('storage') as string;
  const nutritionalInfo = formData.get('nutritionalInfo') as string;

  // Extract base variant (packaging) and missing Product required data
  const size = formData.get('size') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  
  // Fixed: Safely parse GST and generate a fallback SKU if left blank to satisfy Prisma constraints
  const gstRate = parseFloat(formData.get('gstRate') as string) || 0;
  const sku = formData.get('sku') as string || `PRD-${Date.now()}`;

  if (!title || !categoryId || isNaN(price) || isNaN(stock)) return;

  // Generate a URL-friendly slug
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  // Run a database transaction
  await prisma.$transaction(async (tx) => {
    // Fixed: Passed the missing 'sku' and 'gstRate' directly into the Product model
    const product = await tx.product.create({
      data: {
        title,
        slug,
        description: `${description}\n\n**Certification:** ${certification}\n**Shelf Life:** ${shelfLife}\n**Storage:** ${storageDetails}\n**Nutrition:** ${nutritionalInfo}`,
        categoryId,
        active: isActive,
        sku: sku, 
        gstRate: gstRate,
      }
    });

    await tx.productVariant.create({
      data: {
        productId: product.id,
        size,
        price,
        stock,
        sku: sku, // Variant can optionally share the parent SKU for the base size
      }
    });
  });

  // Return to the inventory matrix upon success
  redirect('/admin/inventory');
}

// 2. RENDER COMPONENT: NEW PRODUCT FORM UI
export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8 text-[#212121] font-sans pb-12">
      
      {/* Header Narrative */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#212121] tracking-tight font-poppins">Add New Product</h1>
          <p className="text-[#8D6E63] text-[14px] mt-1 font-medium">
            Create a new organic catalog entry with detailed nutritional and packaging metrics.
          </p>
        </div>
        <Link href="/admin/inventory">
          <button className="text-[#424242] bg-white border border-[#E0E0E0] px-4 py-2 rounded-[8px] text-[14px] font-bold hover:bg-[#F5F5F5] transition-all shadow-sm">
            Cancel & Return
          </button>
        </Link>
      </div>

      <form action={createProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: CORE INFORMATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[18px] font-semibold text-[#212121] font-poppins mb-5 border-b border-[#F5F5F5] pb-3">
              Basic Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Product Name *</label>
                <input type="text" name="title" required placeholder="e.g. Organic Finger Millet (Ragi)" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] text-[#212121] transition-all" />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Detailed Description</label>
                <textarea name="description" rows={4} placeholder="Describe the origin, benefits, and cooking methods..." className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] text-[#212121] transition-all resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Product Category *</label>
                  <select name="categoryId" required className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] text-[#212121] transition-all bg-white cursor-pointer">
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Fixed: Added missing GST Rate Field */}
                <div>
                  <label className="block text-[14px] font-medium text-[#424242] mb-1.5">GST Rate (%) *</label>
                  <input type="number" name="gstRate" step="0.01" min="0" required defaultValue="0" placeholder="e.g. 5" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] text-[#212121] transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Organic Specifications */}
          <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[18px] font-semibold text-[#212121] font-poppins mb-5 border-b border-[#F5F5F5] pb-3">
              Organic & Quality Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Organic Certification</label>
                <input type="text" name="certification" placeholder="e.g. NPOP / Jaivik Bharat" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Shelf Life</label>
                <input type="text" name="shelfLife" placeholder="e.g. 6 Months from manufacturing" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Storage Instructions</label>
                <input type="text" name="storage" placeholder="e.g. Store in a cool, dry place in an airtight container." className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Nutritional Information (per 100g)</label>
                <textarea name="nutritionalInfo" rows={2} placeholder="e.g. Calories: 320kcal, Protein: 7g, Fiber: 10g..." className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121] resize-none"></textarea>
              </div>
            </div>
          </div>

          {/* Card 3: Base Packaging & Variant Options */}
          <div className="bg-[#FFF8E1] rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <h2 className="text-[18px] font-semibold text-[#8D6E63] font-poppins mb-5 border-b border-[#E0E0E0] pb-3">
              Initial Packaging & Stock Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Packaging Size/Weight *</label>
                <input type="text" name="size" required placeholder="e.g. 1kg Bag" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Selling Price (₹) *</label>
                <input type="number" name="price" step="0.01" min="0" required placeholder="0.00" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Current Stock Count *</label>
                <input type="number" name="stock" min="0" required placeholder="0" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121]" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#424242] mb-1.5">Base SKU (Required) *</label>
                <input type="text" name="sku" required placeholder="e.g. MIL-FIN-1KG" className="w-full border border-[#E0E0E0] rounded-[8px] px-4 py-2.5 focus:outline-none focus:border-[#4CAF50] text-[#212121] uppercase" />
              </div>
            </div>
            <p className="text-[12px] text-[#9E9E9E] mt-4">Note: You can add more packaging sizes (e.g., 5kg, 10kg) from the inventory matrix after saving.</p>
          </div>

        </div>

        {/* RIGHT COLUMN: MEDIA & STATUS SETTINGS */}
        <div className="space-y-6 sticky top-24">
          
          {/* Status Settings */}
          <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <h3 className="text-[16px] font-semibold text-[#212121] font-poppins mb-4">Store Visibility</h3>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked className="mt-1 w-4 h-4 text-[#4CAF50] focus:ring-[#4CAF50] border-[#E0E0E0] rounded" />
                <div>
                  <span className="block font-medium text-[#212121] text-[14px]">Active Product</span>
                  <span className="block text-[12px] text-[#9E9E9E] mt-0.5">Will be visible in the public catalog</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="isFeatured" className="mt-1 w-4 h-4 text-[#4CAF50] focus:ring-[#4CAF50] border-[#E0E0E0] rounded" />
                <div>
                  <span className="block font-medium text-[#212121] text-[14px]">Featured Product</span>
                  <span className="block text-[12px] text-[#9E9E9E] mt-0.5">Highlight on the homepage hero section</span>
                </div>
              </label>
            </div>
          </div>

          {/* Media Placeholder */}
          <div className="bg-white rounded-[12px] border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <h3 className="text-[16px] font-semibold text-[#212121] font-poppins mb-4">Product Imagery</h3>
            <div className="border-2 border-dashed border-[#E0E0E0] rounded-[8px] p-8 flex flex-col items-center justify-center text-center bg-[#F5F5F5]">
              <span className="text-3xl mb-2">📸</span>
              <p className="text-[12px] font-medium text-[#424242]">Cloud Storage Module Needed</p>
              <p className="text-[10px] text-[#9E9E9E] mt-1">Image uploads will be enabled once Supabase Storage buckets are configured.</p>
            </div>
          </div>

          {/* Submit Action */}
          <button type="submit" className="w-full bg-[#4CAF50] text-white py-3.5 rounded-[8px] font-bold hover:bg-[#388E3C] transition-all shadow-[0_4px_12px_rgba(76,175,80,0.2)] flex items-center justify-center gap-2">
            <span>💾</span> Save & Publish Product
          </button>
        </div>

      </form>
    </div>
  );
}