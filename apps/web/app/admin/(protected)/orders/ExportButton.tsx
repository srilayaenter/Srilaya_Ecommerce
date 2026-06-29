"use client";

export default function ExportButton({ filter, channel }: { filter: string; channel?: string }) {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("status", filter);
  if (channel && channel !== "all") params.set("channel", channel);
  const href = `/api/admin/orders/export?${params.toString()}`;

  return (
    <a
      href={href}
      download
      className="bg-white border border-[#E0E0E0] text-[#424242] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
    >
      ⬇ Export CSV
    </a>
  );
}
