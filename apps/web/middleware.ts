import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessPath, isAdminRole, ROLE_ALLOWED_PATHS, AppRole } from "@/lib/permissions";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

export default withAuth(
  function middleware(req) {
    const ip = getIp(req as unknown as Request);
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Rate limit: login brute force — 10 attempts per 15 min per IP
    if (path === "/api/auth/callback/credentials" && method === "POST") {
      if (!checkRateLimit(`login:${ip}`, 10, 15 * 60_000)) {
        return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
      }
    }

    // Rate limit: admin API mutations — 120 per minute per IP
    if (path.startsWith("/api/admin/") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (!checkRateLimit(`admin-api:${ip}`, 120, 60_000)) {
        return NextResponse.json({ error: "Too many requests." }, { status: 429 });
      }
    }

    // Rate limit: contact form — 5 submissions per hour per IP
    if (path === "/api/contact" && method === "POST") {
      if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60_000)) {
        return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
      }
    }

    const token = req.nextauth.token;
    const isAuth = !!token;
    const isLoginPage = path.startsWith("/admin/login");
    const isPublicAdminPage =
      path.startsWith("/admin/forgot-password") ||
      path.startsWith("/admin/reset-password");
    const isMfaVerifyPage = path.startsWith("/admin/mfa-verify");
    const isMfaSetupPage  = path.startsWith("/admin/mfa-setup");

    if (isLoginPage || isPublicAdminPage) {
      if (isAuth && isLoginPage) {
        const role = token?.role as string | undefined;
        const allowed = ROLE_ALLOWED_PATHS[role as AppRole] ?? [];
        // Unrestricted roles (owner/admin) land on /admin dashboard
        // Restricted roles land directly on their first permitted page
        const landing =
          allowed.length === 1 && allowed[0] === "/admin"
            ? "/admin"
            : (allowed[0] ?? "/admin");
        return NextResponse.redirect(new URL(landing, req.url));
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
  matcher: ["/admin", "/admin/:path*", "/api/auth/callback/credentials", "/api/admin/:path*", "/api/contact"],
};