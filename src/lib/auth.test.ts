import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMagicLinkToken,
  verifyMagicLinkToken,
  getOrCreateUser,
  findUserByEmail,
  deleteUserAccount,
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
    const verified = await verifyMagicLinkToken(token);
    expect(verified?.email).toBe(email);

    // Second verification should fail (single-use)
    const secondVerification = await verifyMagicLinkToken(token);
    expect(secondVerification).toBeNull();
  });

  it('stores and retrieves name in magic link token', async () => {
    const email = 'user-with-name@example.com';
    const name = 'Maria Silva';
    const token = await createMagicLinkToken(email, name);

    const verified = await verifyMagicLinkToken(token);
    expect(verified?.email).toBe(email);
    expect(verified?.name).toBe(name);
  });

  it('returns null for non-existent token', async () => {
    const result = await verifyMagicLinkToken('non-existent-token-xyz');
    expect(result).toBeNull();
  });

  it('gets or creates a user and assigns a householdId and name', async () => {
    const email = `new-user-${crypto.randomUUID()}@nudge.app`;

    const user1 = await getOrCreateUser(email, 'Alice');
    expect(user1.email).toBe(email);
    expect(user1.name).toBe('Alice');
    expect(user1.householdId).toMatch(/^hh_/);

    // Subsequent retrieval returns the same user and householdId
    const user2 = await getOrCreateUser(email);
    expect(user2.householdId).toBe(user1.householdId);
    expect(user2.name).toBe('Alice');
  });

  it('deletes a user account', async () => {
    const email = `delete-${crypto.randomUUID()}@nudge.app`;
    await getOrCreateUser(email, 'User to delete');

    const foundBefore = await findUserByEmail(email);
    expect(foundBefore).not.toBeNull();

    const deleted = await deleteUserAccount(email);
    expect(deleted).toBe(true);

    const foundAfter = await findUserByEmail(email);
    expect(foundAfter).toBeNull();
  });
});


