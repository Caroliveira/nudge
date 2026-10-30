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
  sendMagicLinkAction,
  updateUserNameAction,
} from './actions';
import { EffortLevel } from '@/types';
import * as sessionModule from '@/lib/session';

vi.mock('@/lib/email', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('actions.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a task and revalidates paths', async () => {
    const task = await createTaskAction({
      title: 'Action Task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Action Task');
  });

  it('updates a task and returns the updated task', async () => {
    const task = await createTaskAction({
      title: 'Task to update',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      recurrenceInterval: 1,
    });

    const updated = await updateTaskAction(task.id, { title: 'Updated Title' });
    expect(updated?.title).toBe('Updated Title');
  });

  it('deletes a task', async () => {
    const task = await createTaskAction({
      title: 'Task to delete',
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
    const { getOrCreateUser, findUserByEmail } = await import('@/lib/auth');
    const user = await getOrCreateUser(email, 'Account To Delete');

    vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
      householdId: user.householdId,
      email: user.email,
      name: user.name,
    });
    const clearSpy = vi.spyOn(sessionModule, 'clearSessionCookie');

    const result = await deleteAccountAction();
    expect(result.success).toBe(true);
    expect(clearSpy).toHaveBeenCalled();

    const found = await findUserByEmail(email);
    expect(found).toBeNull();
  });

  it('validates email format in sendMagicLinkAction', async () => {
    const invalidResult = await sendMagicLinkAction('not-an-email');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBe('invalid_email');
  });

  it('validates name for registration mode in sendMagicLinkAction', async () => {
    const invalidNameResult = await sendMagicLinkAction('valid@nudge.app', {
      mode: 'register',
      name: 'a',
    });
    expect(invalidNameResult.success).toBe(false);
    expect(invalidNameResult.error).toBe('invalid_name');
  });

  it('handles registration flow and prevents duplicate registration', async () => {
    const email = `reg-${Date.now()}@nudge.app`;
    const regResult = await sendMagicLinkAction(email, {
      mode: 'register',
      name: 'New User',
    });
    expect(regResult.success).toBe(true);

    // Simulate user creation (as done after token verification)
    const { getOrCreateUser } = await import('@/lib/auth');
    await getOrCreateUser(email, 'New User');

    // Trying to register again should return account_already_exists
    const duplicateReg = await sendMagicLinkAction(email, {
      mode: 'register',
      name: 'New User',
    });
    expect(duplicateReg.success).toBe(false);
    expect(duplicateReg.error).toBe('account_already_exists');

    // Login for existing user should succeed
    const loginResult = await sendMagicLinkAction(email, { mode: 'login' });
    expect(loginResult.success).toBe(true);
  });

  it('returns account_not_found when logging in with unregistered email', async () => {
    const result = await sendMagicLinkAction('unregistered@nudge.app', { mode: 'login' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('account_not_found');
  });

  it('updates user name via updateUserNameAction', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
      email: 'active-user@nudge.app',
      name: 'Initial Name',
      householdId: 'hh_active',
    });
    vi.spyOn(sessionModule, 'setSessionCookie').mockResolvedValueOnce();

    const { getOrCreateUser } = await import('@/lib/auth');
    await getOrCreateUser('active-user@nudge.app', 'Initial Name');

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
