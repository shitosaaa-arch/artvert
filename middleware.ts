import { NextResponse } from "next/server";
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";

import { isUserRole } from "@/lib/auth/roles";
import { flags } from "@/lib/platform/flags";

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    if (
      request.nextUrl.pathname.startsWith("/api/customer") &&
      !flags.customerAccounts()
    ) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (
      request.nextUrl.pathname.startsWith("/api/analytics") &&
      !flags.analytics()
    ) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const token = request.nextauth.token;

    if (
      !token ||
      !isUserRole(token.role) ||
      !token.sessionExpiresAt ||
      token.sessionExpiresAt <= Date.now()
    ) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      loginUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set(
      "x-request-id",
      request.headers.get("x-request-id") ?? crypto.randomUUID(),
    );
    return response;
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
