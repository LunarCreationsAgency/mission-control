import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get("mc_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifySession(token);

  if (!session) {
    // Clear invalid cookie
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("mc_session", "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/tasks/:path*",
    "/agents/:path*",
    "/goals/:path*",
    "/projects/:path*",
    "/activity",
    "/budgets",
    "/settings",
    "/api/:path*",
  ],
};
