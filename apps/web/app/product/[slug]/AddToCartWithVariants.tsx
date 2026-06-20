'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Variant {
  id: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

export default function AddToCartWithVariants({
  variants,
  productTitle
}: {
  variants: Variant[],
  productTitle: string
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const price = selectedVariant ? selectedVariant.price : 0;

  const handleAddToCart = async () => {
    if (!selectedVariantId) {
      setMessage('Please select a size');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariantId,
          quantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Added to cart!');
        setTimeout(() => {
          router.push('/cart');
        }, 800);
      } else {
        setMessage(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      setMessage('Error adding to cart');
    } finally {
      setLoading(false);
    }
  };

  if (variants.length === 0) {
    return <p className="text-red-600">Product unavailable</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Size:
        </label>
        <select
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-lg"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.size} - ₹{variant.price.toFixed(2)}
              {variant.stock <= 0 ? ' (Out of Stock)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="text-4xl font-bold text-indigo-600 mb-6">
        ₹{price.toFixed(2)}
      </div>

      {selectedVariant && (
        <div className="mb-6">
          <span className="text-gray-600">Stock: </span>
          <span className={`font-semibold ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {selectedVariant.stock > 0 ? `${selectedVariant.stock} available` : 'Out of stock'}
          </span>
        </div>
      )}

      {selectedVariant && selectedVariant.stock > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <label className="font-medium">Quantity:</label>
          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 hover:bg-gray-100 text-lg font-bold"
            >
              −
            </button>
            <span className="px-6 py-2 border-x-2 border-gray-300 text-lg font-semibold min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
              className="px-4 py-2 hover:bg-gray-100 text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={loading || !selectedVariant || selectedVariant.stock <= 0}
        className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Adding...
          </span>
        ) : selectedVariant && selectedVariant.stock <= 0 ? (
          'Out of Stock'
        ) : (
          'Add to Cart'
        )}
      </button>

      {message && (
        <p className={`mt-4 text-center font-semibold ${
          message.includes('Added') ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}