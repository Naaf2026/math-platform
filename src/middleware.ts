import { NextResponse, type NextRequest } from "next/server";

// Temporarily disable the unfinished Learn module, including topic and lesson routes.
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export const config = { matcher: ["/learn", "/learn/:path*"] };
