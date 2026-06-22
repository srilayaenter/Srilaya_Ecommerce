import Link from "next/link";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const menuItems = [
    { name: "Overview Dashboard", href: "/admin", icon: "📊" },
    { name: "Manage Orders", href: "/admin/orders", icon: "📦" },
    { name: "Inventory Matrix", href: "/admin/inventory", icon: "🌾" },
    { name: "Store Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      
      {/* STICKY LEFT SIDEBAR - SriLaYa Foods Green Theme */}
      <aside className="w-64 bg-[#006A38] text-white fixed inset-y-0 left-0 z-20 flex flex-col justify-between shadow-[2px_0_8px_rgba(0,0,0,0.15)]">
        <div>
          {/* Dashboard Header Title Frame */}
          <div className="h-20 flex items-center px-6 border-b border-[#FFFFFF]/20 bg-[#00522B]">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="text-2xl bg-[#FFF8E1] p-1.5 rounded-lg shadow-sm">🚜</span>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] tracking-tight text-white font-poppins">
                  SriLaYa Foods
                </span>
                <span className="text-[10px] text-[#FFF8E1] font-bold tracking-widest uppercase mt-0.5 opacity-90">
                  Admin Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5 mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[8px] transition-all duration-200 text-white/80 hover:text-white hover:bg-white/15 group"
              >
                <span className="text-base transition-transform group-hover:scale-110 duration-200">
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Link */}
        <div className="p-4 border-t border-[#FFFFFF]/20 bg-[#00522B]">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-white text-[#006A38] hover:bg-[#FFF8E1] font-bold text-[13px] py-2.5 px-4 rounded-[8px] transition-all shadow-sm"
          >
            <span>🌐</span> View Storefront
          </Link>
        </div>
      </aside>

      {/* DYNAMIC WORKSPACE */}
      <div className="flex-grow pl-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-[#E0E0E0] sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#006A38] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-widest">
              Live Connection Secured
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-bold text-[13px] text-[#212121]">Store Manager</span>
              <span className="block text-[11px] text-[#9E9E9E] font-medium">System Admin</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FFF8E1] text-[#8D6E63] border border-[#E0E0E0] flex items-center justify-center font-bold text-sm shadow-sm">
              SM
            </div>
          </div>
        </header>

        <main className="flex-grow p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}