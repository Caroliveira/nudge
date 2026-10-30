import { describe, it, expect } from 'vitest';
import {
  getHouseholdData,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  calculateNewStreak,
  refreshRecurringTasks,
} from './db';
import { EffortLevel } from '@/types';

describe('DynamoDB / DB Layer', () => {
  it('creates and retrieves tasks for a household', async () => {
    const id = `test-house-${crypto.randomUUID()}`;
    const initial = await getHouseholdData(id);
    expect(initial.tasks).toHaveLength(0);
    expect(initial.profile.currentStreak).toBe(0);

    const created = await createTask(id, {
      title: 'Water plants',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Water plants');

    const updated = await getHouseholdData(id);
    expect(updated.tasks).toHaveLength(1);
    expect(updated.tasks[0].title).toBe('Water plants');
  });

  it('updates an existing task', async () => {
    const id = `test-house-${crypto.randomUUID()}`;
    const created = await createTask(id, {
      title: 'Old title',
      level: EffortLevel.MEDIUM,
      recurrenceUnit: 'none',
    });

    const updated = await updateTask(id, created.id, { title: 'New title' });
    expect(updated?.title).toBe('New title');

    const data = await getHouseholdData(id);
    expect(data.tasks[0].title).toBe('New title');
  });

  it('deletes a task', async () => {
    const id = `test-house-${crypto.randomUUID()}`;
    const created = await createTask(id, {
      title: 'Task to delete',
      level: EffortLevel.HIGH,
      recurrenceUnit: 'none',
    });

    await deleteTask(id, created.id);
    const data = await getHouseholdData(id);
    expect(data.tasks).toHaveLength(0);
  });

  it('toggles task completion and updates streaks', async () => {
    const id = `test-house-${crypto.randomUUID()}`;
    const created = await createTask(id, {
      title: 'Habit task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
      isCompleted: false,
    });

    const result = await toggleTaskCompletion(id, created.id);
    expect(result?.task.isCompleted).toBe(true);
    expect(result?.profile.currentStreak).toBe(1);
    expect(result?.profile.bestStreak).toBe(1);
  });

  it('calculates streaks correctly across days', () => {
    const day1 = new Date(2026, 0, 1).getTime();
    const day2 = new Date(2026, 0, 2).getTime();
    const day4 = new Date(2026, 0, 4).getTime();

    // Day 1 completion -> streak 1
    const p1 = calculateNewStreak({ currentStreak: 0, bestStreak: 0 }, day1);
    expect(p1.currentStreak).toBe(1);
    expect(p1.bestStreak).toBe(1);

    // Same day completion -> streak remains 1
    const pSameDay = calculateNewStreak(p1, day1 + 1000);
    expect(pSameDay.currentStreak).toBe(1);

    // Consecutive day completion -> streak 2
    const p2 = calculateNewStreak(p1, day2);
    expect(p2.currentStreak).toBe(2);
    expect(p2.bestStreak).toBe(2);

    // Broken streak (skip a day) -> resets to 1
    const pBroken = calculateNewStreak(p2, day4);
    expect(pBroken.currentStreak).toBe(1);
    expect(pBroken.bestStreak).toBe(2);
  });

  it('refreshes recurring tasks when timestamp has passed', async () => {
    const id = `test-house-${crypto.randomUUID()}`;
    const pastTimestamp = Date.now() - 10000;

    const task = await createTask(id, {
      title: 'Daily vitamins',
      level: EffortLevel.LOW,
      isCompleted: true,
      nextAvailableAt: pastTimestamp,
    });

    const refreshed = await refreshRecurringTasks(id);
    const target = refreshed.find((t) => t.id === task.id);
    expect(target?.isCompleted).toBe(false);
    expect(target?.nextAvailableAt).toBeUndefined();
  });
});
