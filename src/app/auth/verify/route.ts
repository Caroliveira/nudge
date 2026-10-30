import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, getOrCreateUser } from '@/lib/auth';
import { setSessionCookieOnResponse } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  const tokenData = await verifyMagicLinkToken(token);
  if (!tokenData) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  const user = await getOrCreateUser(tokenData.email, tokenData.name);
  const response = NextResponse.redirect(new URL('/', request.url));
  await setSessionCookieOnResponse(response, {
    email: user.email,
    name: user.name,
    householdId: user.householdId,
  });

  return response;
}
