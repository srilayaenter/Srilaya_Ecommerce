import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/admin/login");

    if (isAuthPage) {
      if (isAuth) return NextResponse.redirect(new URL("/admin", req.url));
      return NextResponse.next();
    }

    // CRITICAL CHANGE: Only check for "admin" role if the token exists.
    // If token is missing, redirect to login so they can provide credentials.
    if (!isAuth || token?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true so the middleware function above receives the request
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};