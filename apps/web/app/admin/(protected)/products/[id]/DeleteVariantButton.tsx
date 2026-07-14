'use client';

import { useRef } from 'react';

interface Props {
  variantId: string;
  productId: string;
  action: (formData: FormData) => Promise<void>;
}

export default function DeleteVariantButton({ variantId, productId, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (confirm('Delete this variant? This cannot be undone.')) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={action} className="text-right mt-1">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="button"
        onClick={handleClick}
        className="text-red-500 hover:text-red-700 text-xs underline"
      >
        Delete variant
      </button>
    </form>
  );
}
