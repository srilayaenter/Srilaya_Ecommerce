'use client';

import { useState } from "react";

interface InvoiceActionsProps {
  orderId: string;
  defaultEmail: string;
  whatsappUrl: string;
}

export default function InvoiceActions({ orderId, defaultEmail, whatsappUrl }: InvoiceActionsProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function sendEmail() {
    if (!email) { setError('Enter an email address'); return; }
    setSending(true);
    setError('');
    setSent(false);

    const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setSending(false);

    if (res.ok) {
      setSent(true);
    } else {
      setError(data.error ?? 'Failed to send email');
    }
  }

  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#212121] mb-3">Send via Email</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setSent(false); setError(''); }}
            placeholder="customer@email.com"
            className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
          />
          <button
            onClick={sendEmail}
            disabled={sending || !email}
            className="bg-[#006A38] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {sending ? 'Sending…' : 'Send Invoice'}
          </button>
        </div>
        {sent  && <p className="text-green-600 text-xs font-semibold mt-2">Invoice sent to {email}</p>}
        {error && <p className="text-red-500 text-xs font-semibold mt-2">{error}</p>}
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#212121] mb-3">Send via WhatsApp</h3>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#1da851] transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Open WhatsApp
        </a>
        <p className="text-xs text-[#9E9E9E] mt-2">Opens WhatsApp with the receipt message pre-filled. Send it to the customer's number.</p>
      </div>

      {/* Print */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#212121] mb-3">Print Receipt</h3>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-[#F5F5F5] text-[#424242] font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#E0E0E0] transition-colors border border-[#E0E0E0]"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
