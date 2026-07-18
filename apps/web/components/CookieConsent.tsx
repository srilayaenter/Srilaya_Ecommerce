"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "srilaya_privacy_accepted";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-[#212121] text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
      <p className="text-xs text-[#E0E0E0] leading-relaxed max-w-2xl">
        We use cookies and similar technologies to process your personal data for order fulfilment,
        analytics, and service improvement, in accordance with India's{" "}
        <strong className="text-white">Digital Personal Data Protection Act 2023</strong>.
        See our{" "}
        <Link href="/privacy" className="underline text-[#81C784] hover:text-white transition-colors">
          Privacy Policy
        </Link>{" "}
        for details on your rights as a Data Principal.
      </p>
      <div className="flex gap-2 flex-shrink-0">
        <Link
          href="/privacy"
          className="text-xs text-[#9E9E9E] hover:text-white underline whitespace-nowrap transition-colors"
        >
          Learn more
        </Link>
        <button
          onClick={accept}
          className="bg-[#006A38] hover:bg-[#00522B] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          I understand
        </button>
      </div>
    </div>
  );
}
