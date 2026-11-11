import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge guard: bounces visitors without a session cookie away from /admin quickly.
 * (The real check — session validity, expiry and role — happens on the server for every page and action.)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isPublicAdmin = pathname === "/admin/login" || pathname.startsWith("/admin/api/");
  if (isAdmin && !isPublicAdmin && !req.cookies.get("adp_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  if (isAdmin) {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon|icon.svg).*)"] };
