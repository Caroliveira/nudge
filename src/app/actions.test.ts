import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  recordTaskCompletionAction,
  refreshRecurringTasksAction,
  logoutAction,
  sendMagicLinkAction,
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

  it('validates email format in sendMagicLinkAction', async () => {
    const invalidResult = await sendMagicLinkAction('not-an-email');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('e-mail válido');

    const validResult = await sendMagicLinkAction('valid@nudge.app');
    expect(validResult.success).toBe(true);
  });
});
