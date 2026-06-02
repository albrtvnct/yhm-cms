import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/setup"];
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

  // If logged in and on a public route (login/register), redirect to dashboard
  // But DON'T redirect from /setup to avoid infinite loop
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
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
