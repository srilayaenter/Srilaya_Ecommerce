import Link from "next/link";
import { BRAND } from "../../lib/brand";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Navigation matrix for admin actions
  const menuItems = [
    { name: "Overview Dashboard", href: "/admin", icon: "📊" },
    { name: "Manage Orders", href: "/admin/orders", icon: "📦" },
    { name: "Millet Inventory", href: "/admin/inventory", icon: "🌾" },
    { name: "Store Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-100/60 flex text-slate-800">
      
      {/* 1. STICKY LEFT SIDEBAR MENU PANEL */}
      <aside className="w-64 bg-slate-900 text-slate-200 fixed inset-y-0 left-0 z-20 flex flex-col justify-between border-r border-slate-800 shadow-xl">
        <div>
          {/* Dashboard Header Title Frame */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/40">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="text-xl">🚜</span>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-white leading-tight">
                  {BRAND.name}
                </span>
                <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest mt-0.5">
                  Management Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Action Links Menu list */}
          <nav className="p-4 space-y-1.5 mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800 group"
              >
                <span className="text-sm transition-transform group-hover:scale-110 duration-200">
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Link Anchor */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <Link
            href="/product"
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm border border-slate-700/50"
          >
            <span>🌐</span> View Storefront
          </Link>
        </div>
      </aside>

      {/* 2. DYNAMIC WORKSPACE CONTENT WINDOW RIGHT PANEL */}
      <div className="flex-grow pl-64 flex flex-col min-h-screen">
        
        {/* Global Admin Action Top Bar Banner */}
        <header className="h-20 bg-white border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Connection Secured
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-bold text-xs text-slate-800">Store Manager</span>
              <span className="block text-[10px] text-slate-400 font-medium">System Admin</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green border border-emerald-100 flex items-center justify-center font-black text-xs shadow-sm">
              M
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Rendering Yield Frame */}
        <main className="flex-grow p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
}