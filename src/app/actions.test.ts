import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  recordTaskCompletionAction,
  refreshRecurringTasksAction,
  logoutAction,
  deleteAccountAction,
  loginAction,
  registerAction,
  forgotPasswordAction,
  resetPasswordAction,
  updateUserNameAction,
} from './actions';
import { EffortLevel } from '@/types';
import * as sessionModule from '@/lib/session';

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('actions.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a task and revalidates paths', async () => {
    const task = await createTaskAction({
      title: 'Action Task',
      place: 'Geral',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Action Task');
    expect(task.place).toBe('Geral');
  });

  it('updates a task and returns the updated task', async () => {
    const task = await createTaskAction({
      title: 'Task to update',
      place: 'Geral',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
    });

    const updated = await updateTaskAction(task.id, { title: 'Updated Title', place: 'Sala' });
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.place).toBe('Sala');
  });

  it('deletes a task', async () => {
    const task = await createTaskAction({
      title: 'Task to delete',
      place: 'Geral',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
    });

    await expect(deleteTaskAction(task.id)).resolves.not.toThrow();
  });

  it('persists streak completion via recordTaskCompletionAction', async () => {
    const date1 = new Date('2024-05-01T12:00:00Z').getTime();
    const date2 = new Date('2024-05-02T12:00:00Z').getTime();

    const profile1 = await recordTaskCompletionAction(date1);
    expect(profile1.currentStreak).toBe(1);
    expect(profile1.bestStreak).toBe(1);

    const profile2 = await recordTaskCompletionAction(date2);
    expect(profile2.currentStreak).toBe(2);
    expect(profile2.bestStreak).toBe(2);

    // Same day completion should not increment current streak
    const profile3 = await recordTaskCompletionAction(date2 + 1000);
    expect(profile3.currentStreak).toBe(2);
  });

  it('toggles task completion and updates streak', async () => {
    const task = await createTaskAction({
      title: 'Toggle Task',
      place: 'Geral',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
      isCompleted: false,
    });

    const result = await toggleTaskAction(task.id);
    expect(result?.task.isCompleted).toBe(true);
    expect(result?.profile.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('refreshes recurring tasks', async () => {
    const tasks = await refreshRecurringTasksAction();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it('handles logoutAction', async () => {
    const clearSpy = vi.spyOn(sessionModule, 'clearSessionCookie');
    await logoutAction();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('handles deleteAccountAction for logged-in user', async () => {
    const email = `delete-action-${Date.now()}@nudge.app`;
    const { registerUser, findUserByEmail } = await import('@/lib/auth');
    const regResult = await registerUser(email, 'password123', 'Account To Delete');

    vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
      householdId: regResult.user!.householdId,
      email: regResult.user!.email,
      name: regResult.user!.name,
    });
    const clearSpy = vi.spyOn(sessionModule, 'clearSessionCookie');

    const result = await deleteAccountAction();
    expect(result.success).toBe(true);
    expect(clearSpy).toHaveBeenCalled();

    const found = await findUserByEmail(email);
    expect(found).toBeNull();
  });

  describe('Password Auth Actions', () => {
    it('registers a new user and sets session cookie', async () => {
      const email = `register-${Date.now()}@nudge.app`;
      const setSessionSpy = vi.spyOn(sessionModule, 'setSessionCookie');

      const result = await registerAction(email, 'password123', 'Alice');
      expect(result.success).toBe(true);
      expect(setSessionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          name: 'Alice',
        }),
      );

      // Duplicate registration fails
      const duplicate = await registerAction(email, 'anotherpass123', 'Bob');
      expect(duplicate.success).toBe(false);
      expect(duplicate.error).toBe('account_already_exists');
    });

    it('logs in user with correct credentials and sets session cookie', async () => {
      const email = `login-${Date.now()}@nudge.app`;
      const { registerUser } = await import('@/lib/auth');
      await registerUser(email, 'correctPassword', 'User Login');

      const setSessionSpy = vi.spyOn(sessionModule, 'setSessionCookie');

      // Valid login
      const successResult = await loginAction(email, 'correctPassword');
      expect(successResult.success).toBe(true);
      expect(setSessionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          name: 'User Login',
        }),
      );

      // Invalid password
      const wrongPassResult = await loginAction(email, 'wrongPassword');
      expect(wrongPassResult.success).toBe(false);
      expect(wrongPassResult.error).toBe('invalid_credentials');

      // Non-existent user
      const notFoundResult = await loginAction('nonexistent@nudge.app', 'anyPassword');
      expect(notFoundResult.success).toBe(false);
      expect(notFoundResult.error).toBe('account_not_found');
    });

    it('handles forgotPasswordAction and resetPasswordAction flow', async () => {
      const email = `forgot-${Date.now()}@nudge.app`;
      const { registerUser, createPasswordResetToken } = await import('@/lib/auth');
      await registerUser(email, 'initialPassword123', 'Forgot User');

      // Invalid email
      const badEmailResult = await forgotPasswordAction('not-an-email');
      expect(badEmailResult.success).toBe(false);
      expect(badEmailResult.error).toBe('invalid_email');

      // Non-existent email
      const notFoundForgot = await forgotPasswordAction('doesnotexist@nudge.app');
      expect(notFoundForgot.success).toBe(false);
      expect(notFoundForgot.error).toBe('account_not_found');

      // Valid email sends reset link
      const validForgot = await forgotPasswordAction(email);
      expect(validForgot.success).toBe(true);

      // Perform reset with a token
      const token = await createPasswordResetToken(email);
      const resetResult = await resetPasswordAction(token, 'newSecretPassword123');
      expect(resetResult.success).toBe(true);

      // Can now login with new password
      const newLogin = await loginAction(email, 'newSecretPassword123');
      expect(newLogin.success).toBe(true);
    });
  });

  describe('User Profile Actions', () => {
    it('updates user name via updateUserNameAction', async () => {
      const email = `active-user-${Date.now()}@nudge.app`;
      vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        email,
        name: 'Initial Name',
        householdId: 'hh_active',
      });
      vi.spyOn(sessionModule, 'setSessionCookie').mockResolvedValueOnce();

      const { registerUser } = await import('@/lib/auth');
      await registerUser(email, 'password123', 'Initial Name');

      const result = await updateUserNameAction('Updated Name');
      expect(result.success).toBe(true);
      expect(result.name).toBe('Updated Name');
    });

    it('validates name length in updateUserNameAction', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        email: 'active-user@nudge.app',
        name: 'Initial Name',
        householdId: 'hh_active',
      });

      const result = await updateUserNameAction('A');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_name');
    });

    it('returns unauthorized when session is missing in updateUserNameAction', async () => {
      vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce(null);

      const result = await updateUserNameAction('Some Name');
      expect(result.success).toBe(false);
      expect(result.error).toBe('unauthorized');
    });
  });
});
