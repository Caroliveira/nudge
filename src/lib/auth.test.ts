import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  registerUser,
  authenticateUser,
  createPasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  findUserByEmail,
  deleteUserAccount,
  updateUserName,
} from './auth';

describe('auth.ts (In-memory fallback & core logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('hashes and correctly verifies passwords', () => {
      const password = 'mySecretPassword123';
      const hash = hashPassword(password);

      expect(hash).toContain(':');
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('wrongPassword', hash)).toBe(false);
      expect(verifyPassword('', hash)).toBe(false);
      expect(verifyPassword(password, 'invalid-hash')).toBe(false);
    });
  });

  describe('Registration & Authentication', () => {
    it('registers a new user and enables authentication', async () => {
      const email = `test-${crypto.randomUUID()}@nudge.app`;
      const password = 'password123';
      const name = 'Alice';

      const regResult = await registerUser(email, password, name);
      expect(regResult.success).toBe(true);
      expect(regResult.user?.email).toBe(email);
      expect(regResult.user?.name).toBe('Alice');
      expect(regResult.user?.householdId).toMatch(/^hh_/);

      // Authenticate with valid password
      const authSuccess = await authenticateUser(email, password);
      expect(authSuccess.success).toBe(true);
      expect(authSuccess.user?.email).toBe(email);

      // Authenticate with wrong password
      const authFail = await authenticateUser(email, 'wrong-password');
      expect(authFail.success).toBe(false);
      expect(authFail.error).toBe('invalid_credentials');

      // Reject registering existing user
      const duplicate = await registerUser(email, 'anotherpass', 'Bob');
      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toBe('account_already_exists');
    });

    it('validates registration input requirements', async () => {
      const validEmail = `valid-${crypto.randomUUID()}@nudge.app`;

      // Invalid email
      const badEmail = await registerUser('notanemail', 'password123', 'Alice');
      expect(badEmail.success).toBe(false);
      expect(badEmail.error).toBe('invalid_email');

      // Short password
      const shortPass = await registerUser(validEmail, '123', 'Alice');
      expect(shortPass.success).toBe(false);
      expect(shortPass.error).toBe('password_too_short');

      // Short name
      const shortName = await registerUser(validEmail, 'password123', 'A');
      expect(shortName.success).toBe(false);
      expect(shortName.error).toBe('invalid_name');
    });

    it('returns account_not_found when authenticating non-existent user', async () => {
      const result = await authenticateUser('doesnotexist@nudge.app', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('account_not_found');
    });
  });

  describe('Password Reset', () => {
    it('creates, verifies, and resets password using token', async () => {
      const email = `reset-${crypto.randomUUID()}@nudge.app`;
      await registerUser(email, 'originalPassword123', 'Reset User');

      const token = await createPasswordResetToken(email);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token
      const verified = await verifyPasswordResetToken(token);
      expect(verified).toBe(email);

      // Reset password using token
      const resetResult = await resetPasswordWithToken(token, 'newPassword456');
      expect(resetResult.success).toBe(true);

      // After reset, token is consumed and cannot be verified or used again
      const postResetVerify = await verifyPasswordResetToken(token);
      expect(postResetVerify).toBeNull();

      // Old password should fail
      const oldAuth = await authenticateUser(email, 'originalPassword123');
      expect(oldAuth.success).toBe(false);

      // New password should succeed
      const newAuth = await authenticateUser(email, 'newPassword456');
      expect(newAuth.success).toBe(true);

      // Used token cannot be used again
      const reusedReset = await resetPasswordWithToken(token, 'anotherPass123');
      expect(reusedReset.success).toBe(false);
      expect(reusedReset.error).toBe('invalid_token');
    });

    it('returns null/error for non-existent reset token', async () => {
      const verified = await verifyPasswordResetToken('non-existent-token');
      expect(verified).toBeNull();

      const result = await resetPasswordWithToken('non-existent-token', 'newPassword456');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_token');
    });
  });

  describe('User Management', () => {
    it('deletes a user account', async () => {
      const email = `delete-${crypto.randomUUID()}@nudge.app`;
      await registerUser(email, 'password123', 'User to delete');

      const foundBefore = await findUserByEmail(email);
      expect(foundBefore).not.toBeNull();

      const deleted = await deleteUserAccount(email);
      expect(deleted).toBe(true);

      const foundAfter = await findUserByEmail(email);
      expect(foundAfter).toBeNull();
    });

    it('updates user display name with validation', async () => {
      const email = `name-update-${crypto.randomUUID()}@nudge.app`;
      await registerUser(email, 'password123', 'Old Name');

      const updated = await updateUserName(email, 'Brand New Name');
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Brand New Name');

      const found = await findUserByEmail(email);
      expect(found?.name).toBe('Brand New Name');

      const invalidShort = await updateUserName(email, 'A');
      expect(invalidShort).toBeNull();

      const nonExistent = await updateUserName('non-existent@nudge.app', 'Some Name');
      expect(nonExistent).toBeNull();
    });
  });
});
