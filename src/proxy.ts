import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, APP_ROUTES } from './constants';
import { decodeSession } from './lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await decodeSession(sessionCookie) : null;
  const isAuthenticated = Boolean(session);

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth');

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';
  const baseUrl = process.env.APP_URL || `${proto}://${host}`;

  // Unauthenticated user trying to access protected route -> redirect to /login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL(APP_ROUTES.LOGIN, baseUrl);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Authenticated user trying to access /login or /register -> redirect to /
  if (isAuthenticated && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const homeUrl = new URL(APP_ROUTES.HOME, baseUrl);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\..*).*)'],
};
