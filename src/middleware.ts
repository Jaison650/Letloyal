import { NextRequest, NextResponse } from 'next/server';
import { decodeToken, isCustomer, isMerchant } from '@/lib/auth-edge';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Customer routes (/dashboard) ─────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token   = req.cookies.get('letloyal_auth')?.value;
    const payload = token ? decodeToken(token) : null;
    if (!payload || !isCustomer(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ── Merchant routes (/merchant/*) ─────────────────────────────────────────
  if (pathname.startsWith('/merchant/') && !pathname.startsWith('/merchant/login')) {
    const token   = req.cookies.get('letloyal_merchant')?.value;
    const payload = token ? decodeToken(token) : null;

    if (!payload || !isMerchant(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = '/merchant/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Merchants can only access their own dashboard
    const slugFromPath = pathname.split('/')[2];
    if (slugFromPath && payload.slug !== slugFromPath) {
      const url = req.nextUrl.clone();
      url.pathname = `/merchant/${payload.slug}`;
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect already-authenticated users away from login pages ───────────
  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    const token   = req.cookies.get('letloyal_auth')?.value;
    const payload = token ? decodeToken(token) : null;
    if (payload && isCustomer(payload)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  if (pathname === '/merchant/login') {
    const token   = req.cookies.get('letloyal_merchant')?.value;
    const payload = token ? decodeToken(token) : null;
    if (payload && isMerchant(payload)) {
      return NextResponse.redirect(new URL(`/merchant/${payload.slug}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/merchant/:path*', '/auth/:path*'],
};
