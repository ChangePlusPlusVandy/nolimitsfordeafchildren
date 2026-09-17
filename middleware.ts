import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight edge-safe auth guard (replaces the legacy react-router
 * AuthGuard).
 *
 * Only cookie presence is checked here — the better-auth session cookie is
 * opaque and the app role lives in the No Limits UserTable, so full role
 * checks stay server-side in the server actions/queries. The client-side
 * AuthProvider adds the role-aware redirects (pending-approval, role homes).
 */

const SESSION_COOKIE = "better-auth.session_token";

// `/login` is public and should not be shown to signed-in users.
// `/pending-approval` is ALSO public, but the role gates live client-side
// (the middleware only sees an opaque session cookie, never the app role):
// the pending-approval page redirects non-unassigned users to `/` itself,
// and the home page redirects unassigned users to `/pending-approval`.
// Bouncing authenticated users off `/pending-approval` here would create an
// infinite redirect loop for unassigned accounts (page -> `/` -> page).
const PUBLIC_PATHS = new Set(["/login", "/pending-approval"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // better-auth API routes must stay public so sign-in/sign-out can set cookies.
  if (pathname.startsWith("/api/auth")) return true;
  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies;
  // Production may prefix the cookie with __Secure- (or __Host-).
  return (
    cookies.has(SESSION_COOKIE) ||
    cookies.has(`__Secure-${SESSION_COOKIE}`) ||
    cookies.has(`__Host-${SESSION_COOKIE}`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = hasSessionCookie(request);

  // Signed-in users shouldn't see the login screen. (Pending-approval is
  // left alone: the page component applies the role-aware redirect.)
  if (authenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Everything else in the (dashboard) group requires a session.
  if (!authenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, API route handlers (owned by the
  // backend agent, they do their own auth) and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};