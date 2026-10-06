import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, parseSession } from "./lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  const protectedPaths = pathname.startsWith("/editor") || pathname.startsWith("/home");

  if (protectedPaths && !session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/home", "/login"],
};
