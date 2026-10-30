import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SESSION_COOKIE_NAME } from '@/constants';

export interface SessionData {
  email: string;
  householdId: string;
}

const DEFAULT_SECRET = 'nudge-dev-secret-key-change-in-production';

function getSecretKey(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function encodeSession(data: SessionData, secret = getSecretKey()): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function decodeSession(cookieValue: string, secret = getSecretKey()): SessionData | null {
  if (!cookieValue || typeof cookieValue !== 'string') {
    return null;
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  if (!payload || !signature) {
    return null;
  }

  try {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const raw = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.email === 'string' &&
      parsed.email.includes('@') &&
      typeof parsed.householdId === 'string' &&
      parsed.householdId.trim().length > 0
    ) {
      return {
        email: parsed.email.trim().toLowerCase(),
        householdId: parsed.householdId.trim(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (cookie) {
      return decodeSession(cookie);
    }
  } catch {
    // Graceful fallback when called outside of request context (e.g. tests or client mocks)
  }
  return null;
}

export async function getHouseholdId(): Promise<string> {
  const session = await getSession();
  return session?.householdId || 'default-household';
}

export async function setSessionCookie(session: SessionData): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: encodeSession(session),
      ...SESSION_COOKIE_OPTIONS,
    });
  } catch {
    // Fallback if called outside request context
  }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Fallback if called outside request context
  }
}

export function setSessionCookieOnResponse(response: NextResponse, session: SessionData): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSession(session),
    ...SESSION_COOKIE_OPTIONS,
  });
}

export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

