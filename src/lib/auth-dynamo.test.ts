import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();

vi.mock('./dynamodb', () => ({
  TABLE_NAME: 'test_table',
  isDynamoConfigured: true,
  docClient: {
    send: (...args: any[]) => mockSend(...args),
  },
}));

import {
  createMagicLinkToken,
  verifyMagicLinkToken,
  getOrCreateUser,
  findUserByEmail,
  deleteUserAccount,
} from './auth';

describe('auth.ts - DynamoDB configured branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves magic link token via DynamoDB PutCommand with TTL in seconds', async () => {
    mockSend.mockResolvedValueOnce({});

    const token = await createMagicLinkToken('dynamo@example.com', 'Dynamo User');
    expect(token).toBeDefined();
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput.Item.ttl).toBeDefined();
    expect(callInput.Item.name).toBe('Dynamo User');
    expect(typeof callInput.Item.ttl).toBe('number');
    expect(callInput.Item.ttl).toBe(Math.floor(callInput.Item.expiresAt / 1000));
  });

  it('falls back to memory on createMagicLinkToken error', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB put error'));

    const token = await createMagicLinkToken('fallback@example.com');
    expect(token).toBeDefined();
  });

  it('verifies and consumes token atomically via single-step DeleteCommand', async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: {
        PK: 'AUTH_TOKEN#token-123',
        SK: 'TOKEN',
        token: 'token-123',
        email: 'user@example.com',
        name: 'Carlos',
        expiresAt: Date.now() + 60000,
        ttl: Math.floor((Date.now() + 60000) / 1000),
      },
    });

    const payload = await verifyMagicLinkToken('token-123');
    expect(payload).toEqual({ email: 'user@example.com', name: 'Carlos' });
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput.ReturnValues).toBe('ALL_OLD');
    expect(callInput.Key).toEqual({
      PK: 'AUTH_TOKEN#token-123',
      SK: 'TOKEN',
    });
  });

  it('returns null if token not found in DynamoDB', async () => {
    mockSend.mockResolvedValueOnce({ Attributes: undefined });

    const result = await verifyMagicLinkToken('missing-token');
    expect(result).toBeNull();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('returns null if token in DynamoDB has expired', async () => {
    mockSend.mockResolvedValueOnce({
      Attributes: {
        PK: 'AUTH_TOKEN#expired-token',
        SK: 'TOKEN',
        token: 'expired-token',
        email: 'expired@example.com',
        expiresAt: Date.now() - 10000,
      },
    });

    const result = await verifyMagicLinkToken('expired-token');
    expect(result).toBeNull();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('falls back to memory on verifyMagicLinkToken error', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB delete error'));

    const result = await verifyMagicLinkToken('error-token');
    expect(result).toBeNull();
  });

  it('retrieves existing user via DynamoDB GetCommand', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        email: 'existing@example.com',
        householdId: 'hh_existing_123',
        createdAt: 1700000000,
      },
    });

    const user = await getOrCreateUser('existing@example.com');
    expect(user.email).toBe('existing@example.com');
    expect(user.householdId).toBe('hh_existing_123');
  });

  it('creates new user via DynamoDB PutCommand if not existing', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined }); // Not found
    mockSend.mockResolvedValueOnce({}); // PutCommand

    const user = await getOrCreateUser('brand-new@example.com');
    expect(user.email).toBe('brand-new@example.com');
    expect(user.householdId).toMatch(/^hh_/);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('falls back to memory on getOrCreateUser error', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

    const user = await getOrCreateUser('error-user@example.com');
    expect(user.email).toBe('error-user@example.com');
    expect(user.householdId).toBeDefined();
  });

  it('finds existing user by email via DynamoDB', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        email: 'found@example.com',
        name: 'Found User',
        householdId: 'hh_found',
        createdAt: 1700000000,
      },
    });

    const user = await findUserByEmail('found@example.com');
    expect(user).toBeDefined();
    expect(user?.email).toBe('found@example.com');
    expect(user?.name).toBe('Found User');
  });

  it('returns null when findUserByEmail does not find user', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const user = await findUserByEmail('notfound@example.com');
    expect(user).toBeNull();
  });

  it('deletes user account via DynamoDB DeleteCommand', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await deleteUserAccount('delete-dynamo@example.com');
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput.Key).toEqual({
      PK: 'USER#delete-dynamo@example.com',
      SK: 'ACCOUNT',
    });
  });

  it('handles error gracefully when deleteUserAccount DynamoDB fails', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB delete error'));

    const result = await deleteUserAccount('error-delete@example.com');
    expect(result).toBe(true);
  });
});
