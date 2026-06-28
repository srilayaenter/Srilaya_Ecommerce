import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessPath, isAdminRole, ROLE_ALLOWED_PATHS, AppRole } from "@/lib/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const path = req.nextUrl.pathname;
    const isLoginPage = path.startsWith("/admin/login");

    if (isLoginPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const role = token.role as string;

    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (!canAccessPath(role, path)) {
      const allowed = ROLE_ALLOWED_PATHS[role as AppRole] ?? [];
      const fallback = allowed[0] ?? "/";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};