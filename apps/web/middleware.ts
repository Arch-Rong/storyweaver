import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, parseSession } from "./lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/editor") && !session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    const editorUrl = request.nextUrl.clone();
    editorUrl.pathname = "/editor";
    return NextResponse.redirect(editorUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/editor/:path*", "/login"],
};
