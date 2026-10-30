import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, getOrCreateUser } from '@/lib/auth';
import { setSessionCookieOnResponse } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  const email = await verifyMagicLinkToken(token);
  if (!email) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  const user = await getOrCreateUser(email);
  const response = NextResponse.redirect(new URL('/', request.url));
  setSessionCookieOnResponse(response, { email: user.email, householdId: user.householdId });

  return response;
}
