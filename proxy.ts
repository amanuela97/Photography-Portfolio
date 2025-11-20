import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "firebaseSession";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  // For admin routes, check if session cookie exists
  // Actual session verification happens in API route and pages
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", "/admin/gallery");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to admin if session cookie exists and trying to access login
  // Actual validation will happen on the admin page
  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
