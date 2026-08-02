import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import { isUserRole } from "@/lib/auth/roles";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;

    if (!token || !isUserRole(token.role) || !token.sessionExpiresAt || token.sessionExpiresAt <= Date.now()) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      loginUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = { matcher: ["/admin/:path*"] };
