'use client';

import { useRef } from 'react';
import { deleteRawMaterial } from '../actions';

export default function DeleteMaterialButton({ id, name }: { id: string; name: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (confirm(`Delete "${name}" and all its stock history? This cannot be undone.`)) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={deleteRawMaterial}>
      <input type="hidden" name="id" value={id} />
      <button type="button" onClick={handleClick}
        className="w-full bg-red-50 text-red-600 border border-red-200 font-bold py-2.5 rounded-lg hover:bg-red-100 text-sm">
        Delete Material
      </button>
    </form>
  );
}
