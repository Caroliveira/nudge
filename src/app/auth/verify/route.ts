import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, getOrCreateUser } from '@/lib/auth';
import { setSessionCookieOnResponse } from '@/lib/session';

function getBaseUrl(request: NextRequest): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = getBaseUrl(request);

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', baseUrl));
  }

  const tokenData = await verifyMagicLinkToken(token);
  if (!tokenData) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
  }

  const user = await getOrCreateUser(tokenData.email, tokenData.name);
  const response = NextResponse.redirect(new URL('/', baseUrl));
  await setSessionCookieOnResponse(response, {
    email: user.email,
    name: user.name,
    householdId: user.householdId,
  });

  return response;
}
