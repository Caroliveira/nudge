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
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  registerUser,
  authenticateUser,
  findUserByEmail,
  deleteUserAccount,
  updateUserName,
  hashPassword,
} from './auth';

describe('auth.ts - DynamoDB configured branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Reset Tokens with DynamoDB', () => {
    it('saves password reset token via DynamoDB PutCommand with TTL in seconds', async () => {
      mockSend.mockResolvedValueOnce({});

      const token = await createPasswordResetToken('dynamo@example.com');
      expect(token).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(1);

      const callInput = mockSend.mock.calls[0][0].input;
      expect(callInput.Item.PK).toBe(`RESET_TOKEN#${token}`);
      expect(callInput.Item.SK).toBe('TOKEN');
      expect(callInput.Item.type).toBe('PASSWORD_RESET');
      expect(callInput.Item.email).toBe('dynamo@example.com');
      expect(callInput.Item.ttl).toBeDefined();
      expect(typeof callInput.Item.ttl).toBe('number');
      expect(callInput.Item.ttl).toBe(Math.floor(callInput.Item.expiresAt / 1000));
    });

    it('falls back to memory on createPasswordResetToken error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB put error'));

      const token = await createPasswordResetToken('fallback@example.com');
      expect(token).toBeDefined();
    });

    it('verifies reset token via DynamoDB GetCommand', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'RESET_TOKEN#token-123',
          SK: 'TOKEN',
          token: 'token-123',
          email: 'user@example.com',
          expiresAt: Date.now() + 60000,
          ttl: Math.floor((Date.now() + 60000) / 1000),
        },
      });

      const email = await verifyPasswordResetToken('token-123');
      expect(email).toBe('user@example.com');
      expect(mockSend).toHaveBeenCalledTimes(1);

      const callInput = mockSend.mock.calls[0][0].input;
      expect(callInput.Key).toEqual({
        PK: 'RESET_TOKEN#token-123',
        SK: 'TOKEN',
      });
    });

    it('returns null if reset token not found in DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await verifyPasswordResetToken('missing-token');
      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('returns null if reset token in DynamoDB has expired', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'RESET_TOKEN#expired-token',
          SK: 'TOKEN',
          token: 'expired-token',
          email: 'expired@example.com',
          expiresAt: Date.now() - 10000,
        },
      });

      const result = await verifyPasswordResetToken('expired-token');
      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('falls back to memory on verifyPasswordResetToken error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB delete error'));

      const result = await verifyPasswordResetToken('error-token');
      expect(result).toBeNull();
    });
  });

  describe('User Registration & Authentication with DynamoDB', () => {
    it('registers new user via DynamoDB PutCommand after checking GetCommand', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined }); // Not found in findUserByEmail
      mockSend.mockResolvedValueOnce({}); // PutCommand

      const result = await registerUser('brand-new@example.com', 'mypassword123', 'New User');
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('brand-new@example.com');
      expect(result.user?.name).toBe('New User');
      expect(result.user?.householdId).toMatch(/^hh_/);
      expect(mockSend).toHaveBeenCalledTimes(2);

      const putInput = mockSend.mock.calls[1][0].input;
      expect(putInput.Item.PK).toBe('USER#brand-new@example.com');
      expect(putInput.Item.SK).toBe('ACCOUNT');
      expect(putInput.Item.passwordHash).toBeDefined();
    });

    it('rejects registering if user already exists in DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'existing@example.com',
          passwordHash: hashPassword('pass123'),
          householdId: 'hh_123',
          createdAt: 1700000000,
        },
      });

      const result = await registerUser('existing@example.com', 'pass123', 'Existing');
      expect(result.success).toBe(false);
      expect(result.error).toBe('account_already_exists');
    });

    it('authenticates user with valid password via DynamoDB', async () => {
      const password = 'correctPassword';
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'auth@example.com',
          passwordHash: hashPassword(password),
          householdId: 'hh_auth',
          name: 'Auth User',
          createdAt: 1700000000,
        },
      });

      const result = await authenticateUser('auth@example.com', password);
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('auth@example.com');
      expect(result.user?.name).toBe('Auth User');
    });

    it('rejects authentication with invalid password via DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'auth@example.com',
          passwordHash: hashPassword('correctPassword'),
          householdId: 'hh_auth',
          createdAt: 1700000000,
        },
      });

      const result = await authenticateUser('auth@example.com', 'wrongPassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_credentials');
    });

    it('returns account_not_found if user does not exist in DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await authenticateUser('nonexistent@example.com', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('account_not_found');
    });

    it('resets password with token via DynamoDB', async () => {
      // 1. verifyPasswordResetToken (DeleteCommand)
      mockSend.mockResolvedValueOnce({
        Attributes: {
          PK: 'RESET_TOKEN#valid-token',
          SK: 'TOKEN',
          token: 'valid-token',
          email: 'resetme@example.com',
          expiresAt: Date.now() + 60000,
        },
      });
      // 2. findUserByEmail (GetCommand)
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'resetme@example.com',
          passwordHash: hashPassword('oldPassword'),
          householdId: 'hh_reset',
          name: 'Reset Me',
          createdAt: 1700000000,
        },
      });
      // 3. PutCommand saving updated user
      mockSend.mockResolvedValueOnce({});

      const result = await resetPasswordWithToken('valid-token', 'newSuperPassword');
      expect(result.success).toBe(true);

      const putInput = mockSend.mock.calls[2][0].input;
      expect(putInput.Item.PK).toBe('USER#resetme@example.com');
      expect(putInput.Item.passwordHash).toBeDefined();
    });
  });

  describe('User Account Operations with DynamoDB', () => {
    it('finds existing user by email via DynamoDB', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'found@example.com',
          name: 'Found User',
          passwordHash: 'hash',
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

    it('updates user display name via DynamoDB PutCommand', async () => {
      // 1. findUserByEmail call
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'user-to-rename@example.com',
          name: 'Old Name',
          passwordHash: 'hash',
          householdId: 'hh_rename',
          createdAt: 1700000000,
        },
      });
      // 2. putCommand call
      mockSend.mockResolvedValueOnce({});

      const result = await updateUserName('user-to-rename@example.com', 'New Name');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('New Name');
      expect(mockSend).toHaveBeenCalledTimes(2);

      const putInput = mockSend.mock.calls[1][0].input;
      expect(putInput.Item.name).toBe('New Name');
      expect(putInput.Item.PK).toBe('USER#user-to-rename@example.com');
    });
  });
});
