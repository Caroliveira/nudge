import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.APP_URL ||
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.origin;
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return NextResponse.redirect(new URL('/login', url));
}
