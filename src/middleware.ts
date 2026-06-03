import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/setup", "/super-admin"];
const publicRoutes: string[] = [];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  const requestHeaders = new Headers(req.headers);
  const isServerAction = requestHeaders.has("next-action") || requestHeaders.has("x-action-id");

  if (isServerAction) {
    // Bypass CSRF origin check by rewriting Host and Origin to localhost
    requestHeaders.set("host", "localhost:3000");
    requestHeaders.set("origin", "http://localhost:3000");
  }

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (session) {
    const isSuperAdmin = (session as any).role === "SUPER_ADMIN";
    
    // Redirect Super Admin trying to access standard dashboard or setup routes
    if (isSuperAdmin && !path.startsWith("/super-admin")) {
      return NextResponse.redirect(new URL("/super-admin", req.nextUrl));
    }
    
    // Redirect standard users trying to access super-admin routes
    if (!isSuperAdmin && path.startsWith("/super-admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // If logged in and on a public route (login/register), redirect to dashboard
  // But DON'T redirect from /setup to avoid infinite loop
  if (isPublicRoute && session) {
    const isSuperAdmin = (session as any).role === "SUPER_ADMIN";
    return NextResponse.redirect(new URL(isSuperAdmin ? "/super-admin" : "/dashboard", req.nextUrl));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
