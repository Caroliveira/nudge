import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/constants';

export interface SessionData {
  email: string;
  name?: string;
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

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return bufferToBase64Url(encoder.encode(str));
}

function base64UrlToString(base64url: string): string {
  const bytes = base64UrlToUint8Array(base64url);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

async function getHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

export async function encodeSession(data: SessionData, secret = getSecretKey()): Promise<string> {
  const payload = stringToBase64Url(JSON.stringify(data));
  const key = await getHmacKey(secret, 'sign');
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signature = bufferToBase64Url(signatureBuffer);
  return `${payload}.${signature}`;
}

export async function decodeSession(
  cookieValue: string,
  secret = getSecretKey(),
): Promise<SessionData | null> {
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
    const key = await getHmacKey(secret, 'verify');
    const signatureBytes = base64UrlToUint8Array(signature);
    const encoder = new TextEncoder();
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload),
    );

    if (!isValid) {
      return null;
    }

    const raw = base64UrlToString(payload);
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
        ...(typeof parsed.name === 'string' && parsed.name.trim().length > 0
          ? { name: parsed.name.trim() }
          : {}),
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
      return await decodeSession(cookie);
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
    const value = await encodeSession(session);
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value,
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

export async function setSessionCookieOnResponse(
  response: NextResponse,
  session: SessionData,
): Promise<void> {
  const value = await encodeSession(session);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    ...SESSION_COOKIE_OPTIONS,
  });
}

export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}
