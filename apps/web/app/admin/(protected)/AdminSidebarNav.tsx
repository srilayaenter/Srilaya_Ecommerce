'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChartLine, Package, Grains, Tag, ArrowCircleDown, ClipboardText,
  FolderSimple, Truck, ShoppingCart, UsersThree, Star, ArrowUDownLeft,
  Ticket, ChartBar, Receipt, CurrencyCircleDollar, Plant, Factory,
  Archive, Gift, Article, Envelope, Lock, Gear, Desktop, Globe,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

type MenuItem = { name: string; href: string };

const MENU_ICONS: Record<string, PhosphorIcon> = {
  '/admin':                    ChartLine,
  '/admin/orders':             Package,
  '/admin/products':           Grains,
  '/admin/bulk-pricing':       Tag,
  '/admin/inventory-import':   ArrowCircleDown,
  '/admin/stock-log':          ClipboardText,
  '/admin/categories':         FolderSimple,
  '/admin/suppliers':          Truck,
  '/admin/purchase-orders':    ShoppingCart,
  '/admin/users':              UsersThree,
  '/admin/reviews':            Star,
  '/admin/returns':            ArrowUDownLeft,
  '/admin/coupons':            Ticket,
  '/admin/bundles':            Package,
  '/admin/analytics':          ChartBar,
  '/admin/gst-report':         Receipt,
  '/admin/reports/pl':         CurrencyCircleDollar,
  '/admin/raw-materials':      Plant,
  '/admin/production':         Factory,
  '/admin/packaging':          Archive,
  '/admin/loyalty':            Gift,
  '/admin/customers':          UsersThree,
  '/admin/blog':               Article,
  '/admin/failed-emails':      Envelope,
  '/admin/mfa-setup':          Lock,
  '/admin/settings':           Gear,
  '/admin/ops-app':            Desktop,
};

const GROUPS: { label: string; icon: PhosphorIcon; hrefs: string[] }[] = [
  {
    label: 'Orders & Sales',
    icon: Package,
    hrefs: ['/admin/orders', '/admin/returns', '/admin/coupons', '/admin/bundles'],
  },
  {
    label: 'Inventory',
    icon: Grains,
    hrefs: [
      '/admin/products', '/admin/bulk-pricing', '/admin/inventory-import',
      '/admin/stock-log', '/admin/categories', '/admin/suppliers', '/admin/purchase-orders',
    ],
  },
  {
    label: 'Production',
    icon: Factory,
    hrefs: ['/admin/raw-materials', '/admin/production', '/admin/packaging'],
  },
  {
    label: 'Customers',
    icon: UsersThree,
    hrefs: ['/admin/customers', '/admin/loyalty', '/admin/reviews'],
  },
  {
    label: 'Finance',
    icon: ChartBar,
    hrefs: ['/admin/analytics', '/admin/gst-report', '/admin/reports/pl'],
  },
  {
    label: 'Content',
    icon: Article,
    hrefs: ['/admin/blog'],
  },
  {
    label: 'Admin',
    icon: Gear,
    hrefs: ['/admin/users', '/admin/failed-emails', '/admin/mfa-setup', '/admin/settings', '/admin/ops-app'],
  },
];

export default function AdminSidebarNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  const itemMap = new Map(items.map(i => [i.href, i]));

  const activeGroup = GROUPS.find(g =>
    g.hrefs.some(h => pathname === h || pathname.startsWith(h + '/'))
  )?.label ?? null;

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroup ? [activeGroup] : [])
  );

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
      {itemMap.has('/admin') && (() => {
        const DashIcon = MENU_ICONS['/admin'] ?? ChartLine;
        return (
          <Link href="/admin" className={linkClass('/admin')}>
            <DashIcon size={18} weight="regular" />
            <span className="tracking-wide">{itemMap.get('/admin')!.name}</span>
          </Link>
        );
      })()}

      {/* Collapsible groups */}
      {GROUPS.map(group => {
        const groupItems = group.hrefs
          .map(h => itemMap.get(h))
          .filter(Boolean) as MenuItem[];

        if (groupItems.length === 0) return null;

        const isOpen    = openGroups.has(group.label);
        const hasActive = groupItems.some(i => isActive(i.href));
        const GroupIcon = group.icon;

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
                <GroupIcon size={18} weight="regular" />
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
                {groupItems.map(item => {
                  const ItemIcon = MENU_ICONS[item.href] ?? Gear;
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                      <ItemIcon size={16} weight="regular" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
