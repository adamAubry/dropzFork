import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/session";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/api/auth/login", "/api/auth/signup", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie || !sessionCookie.value) {
    // Not logged in - redirect to login or return unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For now, allow access (you'll implement login later)
    // When you implement login, uncomment this:
    // return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  // Verify session token
  try {
    const sessionData = await verifyToken(sessionCookie.value);
    if (!sessionData || new Date(sessionData.expires) < new Date()) {
      // Session expired
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }
      // When you implement login, uncomment this:
      // return NextResponse.redirect(new URL("/login", request.url));
      return NextResponse.next();
    }
  } catch (error) {
    // Invalid token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
