import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_LABELS, AppRole } from "@/lib/permissions";
import LogoutButton from "./LogoutButton";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role ?? 'admin') as AppRole;
  const roleLabel = ROLE_LABELS[role] ?? 'Admin';
  const userInitials = session?.user?.email?.slice(0, 2).toUpperCase() ?? 'SM';

  const allMenuItems = [
    { name: "Overview Dashboard", href: "/admin",               icon: "📊", roles: ['admin','manager'] },
    { name: "Manage Orders",      href: "/admin/orders",        icon: "📦", roles: ['admin','manager','billing_staff'] },
    { name: "Inventory Matrix",   href: "/admin/products",      icon: "🌾", roles: ['admin','manager','inventory_staff'] },
    { name: "Categories",         href: "/admin/categories",    icon: "🗂️", roles: ['admin','manager','inventory_staff'] },
    { name: "Suppliers",          href: "/admin/suppliers",     icon: "🚚", roles: ['admin','manager','inventory_staff'] },
    { name: "Users & Roles",      href: "/admin/users",         icon: "👥", roles: ['admin','manager'] },
    { name: "Reviews",            href: "/admin/reviews",       icon: "⭐", roles: ['admin','manager'] },
    { name: "Coupons",            href: "/admin/coupons",       icon: "🎟️", roles: ['admin','manager'] },
    { name: "Failed Emails",      href: "/admin/failed-emails", icon: "✉️", roles: ['admin','manager'] },
    { name: "MFA Setup",          href: "/admin/mfa-setup",     icon: "🔐", roles: ['admin','manager','inventory_staff','billing_staff'] },
    { name: "Store Settings",     href: "/admin/settings",      icon: "⚙️", roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F5] flex font-sans overflow-hidden">
      
      {/* STICKY LEFT SIDEBAR - Flex child */}
      <aside className="w-64 bg-[#006A38] text-white flex-shrink-0 flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.15)] z-20">
        
        {/* Dashboard Header Title Frame */}
        <div className="h-20 flex-shrink-0 flex items-center px-6 bg-[#00522B] border-b border-[#006A38]">
          <Link href="/admin" className="flex items-center gap-3">
            
            {/* SriLaYa Logo replacing the Tractor Emoji */}
            <div className="bg-white p-1 rounded-md shadow-sm flex items-center justify-center w-[38px] h-[38px] flex-shrink-0">
              <Image 
                src="/brand/srilaya-logo.png" 
                alt="SriLaYa Logo" 
                width={30} 
                height={30} 
                className="object-contain"
              />
            </div>
            
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
        <div className="flex-grow overflow-y-auto py-6 custom-scrollbar">
          <nav className="px-4 flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[8px] text-white/90 hover:text-white hover:bg-[#00522B] transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Link */}
        <div className="p-4 bg-[#00522B] flex-shrink-0 mt-auto">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-white text-[#006A38] hover:bg-[#FFF8E1] font-bold text-[13px] py-2.5 px-4 rounded-[8px] transition-all shadow-sm"
          >
            <span>🌐</span> View Storefront
          </Link>
        </div>
      </aside>

      {/* DYNAMIC WORKSPACE - Scrolling Flex Child */}
      <div className="flex-grow flex flex-col overflow-y-auto bg-[#F5F5F5] relative">
        <header className="h-20 flex-shrink-0 bg-white border-b border-[#E0E0E0] sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#006A38] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-widest">
              Live Connection Secured
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-bold text-[13px] text-[#212121]">{session?.user?.email ?? 'Admin'}</span>
              <span className="block text-[11px] text-[#9E9E9E] font-medium">{roleLabel}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FFF8E1] text-[#8D6E63] border border-[#E0E0E0] flex items-center justify-center font-bold text-sm shadow-sm">
              {userInitials}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-grow p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}