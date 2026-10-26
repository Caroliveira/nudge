import { describe, it, expect, vi } from 'vitest';
import {
  getNextAvailableDate,
  calculateTaskCompletion,
  isTaskAvailable,
  pickRandomTask,
  isOneTimeTask,
  getTasksForLevel,
} from './taskUtils';
import { Task, EffortLevel } from '../types';
import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns';

describe('taskUtils', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    level: EffortLevel.LOW,
    recurrenceUnit: 'days',
    recurrenceInterval: 1,
  };

  describe('getNextAvailableDate', () => {
    it('returns null if task has no lastCompletedAt', () => {
      expect(getNextAvailableDate(mockTask)).toBeNull();
    });

    it('returns null if recurrenceUnit is none', () => {
      const task = { ...mockTask, recurrenceUnit: 'none' as const, lastCompletedAt: Date.now() };
      expect(getNextAvailableDate(task)).toBeNull();
    });

    it('calculates next date correctly for daily recurrence', () => {
      const lastCompleted = new Date('2023-01-01T10:00:00');
      const task = { ...mockTask, lastCompletedAt: lastCompleted.getTime() };
      const expected = startOfDay(addDays(lastCompleted, 1));

      const result = getNextAvailableDate(task);
      expect(result).toEqual(expected);
    });

    it('calculates next date correctly for weekly recurrence', () => {
      const lastCompleted = new Date('2023-01-01T10:00:00');
      const task = {
        ...mockTask,
        recurrenceUnit: 'weeks' as const,
        lastCompletedAt: lastCompleted.getTime(),
      };
      const expected = startOfDay(addWeeks(lastCompleted, 1));

      const result = getNextAvailableDate(task);
      expect(result).toEqual(expected);
    });

    it('calculates next date correctly for monthly recurrence', () => {
      const lastCompleted = new Date('2023-01-01T10:00:00');
      const task = {
        ...mockTask,
        recurrenceUnit: 'months' as const,
        lastCompletedAt: lastCompleted.getTime(),
      };
      const expected = startOfDay(addMonths(lastCompleted, 1));

      const result = getNextAvailableDate(task);
      expect(result).toEqual(expected);
    });

    it('calculates next date correctly for yearly recurrence', () => {
      const lastCompleted = new Date('2023-01-01T10:00:00');
      const task = {
        ...mockTask,
        recurrenceUnit: 'years' as const,
        lastCompletedAt: lastCompleted.getTime(),
      };
      const expected = startOfDay(addYears(lastCompleted, 1));

      const result = getNextAvailableDate(task);
      expect(result).toEqual(expected);
    });
  });

  describe('calculateTaskCompletion', () => {
    it('updates task as completed and sets nextAvailableAt for recurring task', () => {
      const result = calculateTaskCompletion(mockTask, true);

      expect(result.isCompleted).toBe(true);
      expect(result.lastCompletedAt).toBeDefined();
      expect(result.nextAvailableAt).toBeDefined();
    });

    it('updates task as completed but no nextAvailableAt for one-time task', () => {
      const task = { ...mockTask, recurrenceUnit: 'none' as const };
      const result = calculateTaskCompletion(task, true);

      expect(result.isCompleted).toBe(true);
      expect(result.lastCompletedAt).toBeDefined();
      expect(result.nextAvailableAt).toBeUndefined();
    });

    it('clears completion status when toggled off', () => {
      const completedTask = {
        ...mockTask,
        isCompleted: true,
        lastCompletedAt: Date.now(),
        nextAvailableAt: Date.now(),
      };
      const result = calculateTaskCompletion(completedTask, false);

      expect(result.isCompleted).toBe(false);
      expect(result.lastCompletedAt).toBeUndefined();
      expect(result.nextAvailableAt).toBeUndefined();
    });
  });

  describe('isTaskAvailable', () => {
    it('returns true if task is not completed', () => {
      expect(isTaskAvailable(mockTask)).toBe(true);
    });

    it('returns false if task is completed and no nextAvailableAt', () => {
      const task = { ...mockTask, isCompleted: true };
      expect(isTaskAvailable(task)).toBe(false);
    });

    it('returns false if nextAvailableAt is in the future', () => {
      const futureDate = addDays(new Date(), 1).getTime();
      const task = { ...mockTask, isCompleted: true, nextAvailableAt: futureDate };
      expect(isTaskAvailable(task)).toBe(false);
    });

    it('returns true if nextAvailableAt is in the past', () => {
      const pastDate = addDays(new Date(), -1).getTime();
      const task = { ...mockTask, isCompleted: true, nextAvailableAt: pastDate };
      expect(isTaskAvailable(task)).toBe(true);
    });
  });

  describe('pickRandomTask', () => {
    it('returns null for empty list', () => {
      expect(pickRandomTask([])).toBeNull();
    });

    it('returns the only task if list has one item', () => {
      expect(pickRandomTask([mockTask])).toEqual(mockTask);
    });

    it('returns a task from the list', () => {
      const task2 = { ...mockTask, id: '2' };
      const result = pickRandomTask([mockTask, task2]);
      expect([mockTask, task2]).toContain(result);
    });

    it('distributes selections deterministically based on random value', () => {
      const task1 = { ...mockTask, id: '1' };
      const task2 = { ...mockTask, id: '2' };
      const tasks = [task1, task2];

      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      expect(pickRandomTask(tasks)).toEqual(task1);

      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      expect(pickRandomTask(tasks)).toEqual(task2);

      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('isOneTimeTask', () => {
    it('returns true for task with no recurrence', () => {
      const task = { ...mockTask, recurrenceUnit: 'none' as const };
      expect(isOneTimeTask(task)).toBe(true);
    });

    it('returns false for task with recurrence', () => {
      expect(isOneTimeTask(mockTask)).toBe(false);
    });
  });

  describe('getTasksForLevel', () => {
    it('filters tasks by level and availability', () => {
      const taskLow = { ...mockTask, level: EffortLevel.LOW };
      const taskHigh = { ...mockTask, id: '2', level: EffortLevel.HIGH };
      const taskLowCompleted = { ...mockTask, id: '3', isCompleted: true }; // Not available

      const tasks = [taskLow, taskHigh, taskLowCompleted];
      const result = getTasksForLevel(tasks, EffortLevel.LOW);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(taskLow);
    });
  });
});
