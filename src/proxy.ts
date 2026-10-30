import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, APP_ROUTES } from './constants';
import { decodeSession } from './lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await decodeSession(sessionCookie) : null;
  const isAuthenticated = Boolean(session);

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth');

  // Unauthenticated user trying to access protected route -> redirect to /login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL(APP_ROUTES.LOGIN, request.url);
    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // Authenticated user trying to access /login -> redirect to /
  if (isAuthenticated && pathname.startsWith('/login')) {
    const homeUrl = new URL(APP_ROUTES.HOME, request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\..*).*)'],
};
