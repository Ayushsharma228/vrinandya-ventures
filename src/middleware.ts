import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const role = token?.role as string | undefined;
  const onboardingDone = token?.onboardingDone as boolean | undefined;

  // ── Admin routes (exclude /admin/login which is public) ──────────────────
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // ── Seller routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/seller")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "SELLER") return NextResponse.redirect(new URL("/login", req.url));
    // Gate: force onboarding completion before accessing the dashboard
    if (!onboardingDone && !pathname.startsWith("/seller/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  // ── Supplier routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/supplier")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "SUPPLIER") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // ── Sales routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/sales")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (role !== "SALES" && role !== "ADMIN") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/((?!login$).*)", // all /admin/* except /admin/login
    "/seller/:path*",
    "/supplier/:path*",
    "/sales/:path*",
  ],
};
