import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-indigo-600">
                Dashboard
              </Link>
              <Link href="/admin/products" className="text-gray-700 hover:text-indigo-600">
                Products
              </Link>
              <Link href="/admin/orders" className="text-gray-700 hover:text-indigo-600">
                Orders
              </Link>
              <Link href="/admin/categories" className="text-gray-700 hover:text-indigo-600">
                Categories
              </Link>
              <Link href="/admin/failed-emails" className="text-gray-700 hover:text-indigo-600">
                Failed Emails
              </Link>
              <Link href="/admin/settings" className="text-gray-700 hover:text-indigo-600">
                Settings
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}