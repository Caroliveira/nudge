import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMagicLinkToken,
  verifyMagicLinkToken,
  getOrCreateUser,
} from './auth';

describe('auth.ts (In-memory fallback & core logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and verifies a valid magic link token', async () => {
    const email = 'user@example.com';
    const token = await createMagicLinkToken(email);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // First verification should succeed
    const verifiedEmail = await verifyMagicLinkToken(token);
    expect(verifiedEmail).toBe(email);

    // Second verification should fail (single-use)
    const secondVerification = await verifyMagicLinkToken(token);
    expect(secondVerification).toBeNull();
  });

  it('returns null for non-existent token', async () => {
    const result = await verifyMagicLinkToken('non-existent-token-xyz');
    expect(result).toBeNull();
  });

  it('gets or creates a user and assigns a householdId', async () => {
    const email = `new-user-${crypto.randomUUID()}@nudge.app`;

    const user1 = await getOrCreateUser(email);
    expect(user1.email).toBe(email);
    expect(user1.householdId).toMatch(/^hh_/);

    // Subsequent retrieval returns the same user and householdId
    const user2 = await getOrCreateUser(email);
    expect(user2.householdId).toBe(user1.householdId);
  });
});
