import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optional security middleware for fi-edback
 *
 * Copy this file to your app as `middleware.ts` (at the root level, next to `app/`)
 * to add CORS protection and rate limiting headers.
 *
 * This is OPTIONAL - the route handler has built-in security checks.
 * Use this only if you need additional control over allowed origins.
 */

// Configure allowed origins for your preview deployments
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  process.env.NEXT_PUBLIC_SITE_URL,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,
  "http://localhost:3000",
].filter((origin): origin is string | RegExp => Boolean(origin));

export function middleware(request: NextRequest) {
  // Only apply to fi-edback API routes
  if (!request.nextUrl.pathname.startsWith("/api/fi-edback")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const isAllowedOrigin =
    !origin || // Same-origin requests have no origin header
    ALLOWED_ORIGINS.some((allowed) =>
      typeof allowed === "string" ? allowed === origin : allowed.test(origin),
    );

  // Block requests from disallowed origins
  if (!isAllowedOrigin) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  // Add security headers
  const response = NextResponse.next();

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

export const config = {
  matcher: "/api/fi-edback/:path*",
};
