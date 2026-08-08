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

    // الجواسيس الجديدة لكشف محتوى التوكن
    console.log("=== 1. التوكن الذي وصل للميدل وير ===", token);
    console.log("=== 2. نتيجة فحص الصلاحية ===", token ? isUserRole(token.role) : "لا يوجد توكن");
    console.log("=== 3. وقت الانتهاء مقابل الوقت الحالي ===", token?.sessionExpiresAt, "<=", Date.now());

    if (
      !token ||
      !isUserRole(token.role) ||
      !token.sessionExpiresAt ||
      token.sessionExpiresAt <= Date.now()
    ) {
      console.log("=== 4. الرفض: تم تفعيل شرط الطرد والتوجيه لصفحة الدخول ===");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      loginUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(loginUrl);
    }

    console.log("=== 5. نجاح: السماح بالمرور للوحة التحكم ===");
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