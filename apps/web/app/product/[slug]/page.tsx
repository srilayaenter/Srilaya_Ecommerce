import { prisma } from "../../../lib/db";
import { notFound } from "next/navigation";
import AddToCartWithVariants from "./AddToCartWithVariants";

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    }
  });

  if (!product) {
    notFound();
  }

  const serializedVariants = product.variants.map(variant => ({
    id: variant.id,
    size: variant.size,
    price: parseFloat(variant.price.toString()),
    stock: variant.stock,
    sku: variant.sku,
  }));

  const ratingDisplay = product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '4.5';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full rounded-lg shadow-md"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-lg">No image</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-indigo-600 font-semibold mb-2">
            {product.category.name}
          </div>
          <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-4">
            <span className="text-gray-600">SKU: </span>
            <span className="font-semibold">{product.sku}</span>
          </div>

          <div className="mb-6">
            <span className="text-gray-600">Rating: </span>
            <span className="font-semibold">⭐ {ratingDisplay}</span>
            <span className="text-gray-600 ml-2">({product.reviews} reviews)</span>
          </div>

          <AddToCartWithVariants
            variants={serializedVariants}
            productTitle={product.title}
          />
        </div>
      </div>
    </div>
  );
}