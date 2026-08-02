import { createHash, randomBytes } from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "artvert_customer_session";
const secret = () => process.env.CUSTOMER_TOKEN_PEPPER ?? process.env.NEXTAUTH_SECRET ?? "development-only-customer-pepper";

export const normalizeCustomerEmail = (value: string) => value.trim().toLowerCase();
export const hashCustomerSecret = (value: string) => createHash("sha256").update(`${secret()}:${value}`).digest("hex");
export const newCustomerSecret = () => randomBytes(32).toString("base64url");
export const requestIpHash = (request: Request) => hashCustomerSecret(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown");

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // native/mobile clients may omit Origin; cookies remain SameSite=Lax.
  if (origin !== new URL(request.url).origin) throw new Error("CSRF_REJECTED");
}

export function customerCookie(value: string, maxAge = 60 * 60 * 24 * 30) {
  return { name: CUSTOMER_SESSION_COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}
