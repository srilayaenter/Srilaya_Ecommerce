'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type MenuItem = { name: string; href: string; icon: string };

const GROUPS: { label: string; icon: string; hrefs: string[] }[] = [
  {
    label: 'Orders & Sales',
    icon: '📦',
    hrefs: ['/admin/orders', '/admin/returns', '/admin/coupons', '/admin/bundles'],
  },
  {
    label: 'Inventory',
    icon: '🌾',
    hrefs: [
      '/admin/products', '/admin/bulk-pricing', '/admin/inventory-import',
      '/admin/stock-log', '/admin/categories', '/admin/suppliers', '/admin/purchase-orders',
    ],
  },
  {
    label: 'Production',
    icon: '🏭',
    hrefs: ['/admin/raw-materials', '/admin/production', '/admin/packaging'],
  },
  {
    label: 'Customers',
    icon: '👥',
    hrefs: ['/admin/customers', '/admin/loyalty', '/admin/reviews'],
  },
  {
    label: 'Finance',
    icon: '💰',
    hrefs: ['/admin/analytics', '/admin/gst-report', '/admin/reports/pl'],
  },
  {
    label: 'Content',
    icon: '📝',
    hrefs: ['/admin/blog'],
  },
  {
    label: 'Admin',
    icon: '⚙️',
    hrefs: ['/admin/users', '/admin/failed-emails', '/admin/mfa-setup', '/admin/settings', '/admin/ops-app'],
  },
];

export default function AdminSidebarNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  // Build a lookup: href → item
  const itemMap = new Map(items.map(i => [i.href, i]));

  // Find which group the current path belongs to
  const activeGroup = GROUPS.find(g =>
    g.hrefs.some(h => pathname === h || pathname.startsWith(h + '/'))
  )?.label ?? null;

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroup ? [activeGroup] : [])
  );

  // When route changes, ensure the active group is open
  useEffect(() => {
    if (activeGroup) {
      setOpenGroups(prev => {
        if (prev.has(activeGroup)) return prev;
        const next = new Set(prev);
        next.add(activeGroup);
        return next;
      });
    }
  }, [activeGroup]);

  function toggle(label: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-[8px] transition-colors ${
      isActive(href)
        ? 'bg-white/20 text-white font-bold'
        : 'text-white/80 hover:text-white hover:bg-[#00522B]'
    }`;

  return (
    <nav className="px-3 flex flex-col gap-1">

      {/* Standalone: Overview Dashboard */}
      {itemMap.has('/admin') && (
        <Link href="/admin" className={linkClass('/admin')}>
          <span className="text-lg">{itemMap.get('/admin')!.icon}</span>
          <span className="tracking-wide">{itemMap.get('/admin')!.name}</span>
        </Link>
      )}

      {/* Collapsible groups */}
      {GROUPS.map(group => {
        const groupItems = group.hrefs
          .map(h => itemMap.get(h))
          .filter(Boolean) as MenuItem[];

        if (groupItems.length === 0) return null;

        const isOpen    = openGroups.has(group.label);
        const hasActive = groupItems.some(i => isActive(i.href));

        return (
          <div key={group.label}>
            <button
              onClick={() => toggle(group.label)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[8px] text-sm font-bold transition-colors ${
                hasActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-[#00522B]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <span className="tracking-wide">{group.label}</span>
              </span>
              <span
                className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                style={{ display: 'inline-block' }}
              >
                ▶
              </span>
            </button>

            {isOpen && (
              <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                {groupItems.map(item => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
