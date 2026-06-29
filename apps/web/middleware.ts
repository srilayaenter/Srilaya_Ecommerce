import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessPath, isAdminRole, ROLE_ALLOWED_PATHS, AppRole } from "@/lib/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const path = req.nextUrl.pathname;
    const isLoginPage = path.startsWith("/admin/login");
    const isPublicAdminPage =
      path.startsWith("/admin/forgot-password") ||
      path.startsWith("/admin/reset-password");
    const isMfaVerifyPage = path.startsWith("/admin/mfa-verify");
    const isMfaSetupPage  = path.startsWith("/admin/mfa-setup");

    if (isLoginPage || isPublicAdminPage) {
      if (isAuth && isLoginPage) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // MFA pending — only allow the verify page
    const totpPending = token?.totpPending === true;
    if (totpPending && !isMfaVerifyPage) {
      return NextResponse.redirect(new URL("/admin/mfa-verify", req.url));
    }
    if (isMfaVerifyPage || isMfaSetupPage) return NextResponse.next();

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
      // Allow login/reset pages through without a token so NextAuth doesn't
      // redirect them to itself, creating an infinite callbackUrl loop.
      // The middleware function above handles all role/MFA checks for
      // authenticated paths.
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const isPublic =
          path.startsWith("/admin/login") ||
          path.startsWith("/admin/forgot-password") ||
          path.startsWith("/admin/reset-password") ||
          path.startsWith("/admin/mfa-verify");
        return isPublic || !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};