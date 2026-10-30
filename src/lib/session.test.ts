import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encodeSession,
  decodeSession,
  getSession,
  getHouseholdId,
  setSessionCookie,
  clearSessionCookie,
} from './session';
import { SESSION_COOKIE_NAME } from '@/constants';
import * as nextHeaders from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encodes and decodes session data correctly', async () => {
    const session = { email: 'test@example.com', householdId: 'house-123' };
    const encoded = await encodeSession(session);
    const decoded = await decodeSession(encoded);

    expect(decoded).toEqual(session);
  });

  it('rejects tampered cookie payload or signature', async () => {
    const session = { email: 'test@example.com', householdId: 'house-123' };
    const encoded = await encodeSession(session);
    const [payload, signature] = encoded.split('.');

    // Tampered payload
    const forgedPayload = Buffer.from(
      JSON.stringify({ email: 'admin@example.com', householdId: 'house-999' }),
    ).toString('base64url');
    expect(await decodeSession(`${forgedPayload}.${signature}`)).toBeNull();

    // Tampered signature
    expect(await decodeSession(`${payload}.invalid-sig`)).toBeNull();

    // Wrong secret
    expect(await decodeSession(encoded, 'different-secret-key')).toBeNull();
  });

  it('returns null when decoding invalid formats or missing fields', async () => {
    expect(await decodeSession('invalid-format-without-dot')).toBeNull();
    expect(await decodeSession('too.many.dots.here')).toBeNull();
    expect(await decodeSession('')).toBeNull();
    expect(await decodeSession(null as any)).toBeNull();

    // Missing email or householdId
    const missingEmail = Buffer.from(JSON.stringify({ householdId: 'h1' })).toString('base64url');
    expect(await decodeSession(`${missingEmail}.any`)).toBeNull();
  });

  it('retrieves session from cookies', async () => {
    const validEncoded = await encodeSession({ email: 'user@nudge.app', householdId: 'h-456' });
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: validEncoded }),
    };
    vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

    const session = await getSession();
    expect(session?.email).toBe('user@nudge.app');
    expect(session?.householdId).toBe('h-456');

    const householdId = await getHouseholdId();
    expect(householdId).toBe('h-456');
  });

  it('returns null / default-household if cookie is missing', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };
    vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

    expect(await getSession()).toBeNull();
    expect(await getHouseholdId()).toBe('default-household');
  });

  it('returns null / default-household if cookies() throws', async () => {
    vi.mocked(nextHeaders.cookies).mockRejectedValue(new Error('Outside request context'));

    expect(await getSession()).toBeNull();
    expect(await getHouseholdId()).toBe('default-household');
  });

  it('sets session cookie', async () => {
    const mockSet = vi.fn();
    const mockCookieStore = { set: mockSet };
    vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

    await setSessionCookie({ email: 'new@nudge.app', householdId: 'h-new' });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SESSION_COOKIE_NAME,
        path: '/',
        httpOnly: true,
      }),
    );
  });

  it('clears session cookie', async () => {
    const mockDelete = vi.fn();
    const mockCookieStore = { delete: mockDelete };
    vi.mocked(nextHeaders.cookies).mockResolvedValue(mockCookieStore as any);

    await clearSessionCookie();
    expect(mockDelete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});
