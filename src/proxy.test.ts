import { describe, it, expect } from 'vitest';
import { proxy } from './proxy';
import { SESSION_COOKIE_NAME } from './constants';
import { encodeSession } from './lib/session';
import { NextRequest } from 'next/server';

describe('proxy', () => {
  const validSessionCookie = encodeSession({
    email: 'user@nudge.app',
    householdId: 'house-123',
  });

  it('redirects unauthenticated user accessing protected route to /login', () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows unauthenticated user accessing /login', () => {
    const request = new NextRequest('http://localhost:3000/login');
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it('allows unauthenticated user accessing /auth/verify', () => {
    const request = new NextRequest('http://localhost:3000/auth/verify?token=123');
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it('redirects authenticated user accessing /login to /', () => {
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${validSessionCookie}`,
      },
    });
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('allows authenticated user accessing protected route', () => {
    const request = new NextRequest('http://localhost:3000/catalog', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${validSessionCookie}`,
      },
    });
    const response = proxy(request);

    expect(response.status).toBe(200);
  });

  it('redirects user with tampered or invalid cookie to /login and clears cookie', () => {
    const request = new NextRequest('http://localhost:3000/catalog', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=tampered-invalid-cookie`,
      },
    });
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });
});
