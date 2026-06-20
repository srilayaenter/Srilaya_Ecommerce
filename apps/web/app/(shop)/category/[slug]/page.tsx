import { prisma } from "../../../../lib/db";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: slug },
    include: {
      products: {
        where: { active: true },
        include: {
          variants: { orderBy: { price: 'asc' } }
        },
        orderBy: { title: 'asc' }
      }
    }
  });

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link href="/">
          <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Go Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{category.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {category.products.map(product => {
          const prices = product.variants.map(v => parseFloat(v.price.toString()));
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceDisplay = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
          const ratingDisplay = product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '4.5';

          return (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {product.variants.length} size{product.variants.length > 1 ? 's' : ''} available
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-indigo-600">{priceDisplay}</span>
                    <span className="text-sm text-gray-600">⭐ {ratingDisplay}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {category.products.length === 0 && (
        <p className="text-gray-600 text-center py-8">No products found in this category.</p>
      )}
    </div>
  );
}