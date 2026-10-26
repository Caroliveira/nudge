import { describe, it, expect } from 'vitest';
import { validateHeaders, processImportedTasks } from './csvUtils';
import { EffortLevel, Task } from '../types';

describe('csvUtils', () => {
  describe('validateHeaders', () => {
    it('returns true for valid headers', () => {
      const headers = ['title', 'effort', 'interval', 'unit'];
      expect(validateHeaders(headers)).toBe(true);
    });

    it('returns true for valid headers regardless of order', () => {
      const headers = ['unit', 'interval', 'effort', 'title'];
      expect(validateHeaders(headers)).toBe(true);
    });

    it('returns false if a header is missing', () => {
      const headers = ['title', 'effort', 'interval'];
      expect(validateHeaders(headers)).toBe(false);
    });
  });

  describe('processImportedTasks', () => {
    const existingTasks: Task[] = [
      {
        id: '1',
        title: 'Existing Task',
        level: EffortLevel.LOW,
        recurrenceUnit: 'none',
      },
    ];

    it('processes valid tasks correctly', () => {
      const data = [
        { title: 'New Task', effort: 'Low', interval: '1', unit: 'days' },
        { title: 'Hard Task', effort: 'High', interval: '2', unit: 'weeks' },
      ];

      const result = processImportedTasks(data, existingTasks);

      expect(result.count).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.tasksToAdd).toHaveLength(2);
      expect(result.tasksToAdd[0]).toMatchObject({
        title: 'New Task',
        level: EffortLevel.LOW,
        recurrenceUnit: 'days',
        recurrenceInterval: 1,
      });
      expect(result.tasksToAdd[1]).toMatchObject({
        title: 'Hard Task',
        level: EffortLevel.HIGH,
        recurrenceUnit: 'weeks',
        recurrenceInterval: 2,
      });
    });

    it('skips duplicates', () => {
      const data = [
        { title: 'Existing Task', effort: 'Low', interval: '1', unit: 'days' },
        { title: 'New Task', effort: 'Low', interval: '1', unit: 'days' },
      ];

      const result = processImportedTasks(data, existingTasks);

      expect(result.count).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.tasksToAdd[0].title).toBe('New Task');
    });

    it('ignores invalid rows', () => {
      const data = [
        { title: '', effort: 'Low', interval: '1', unit: 'days' }, // Missing title
        { title: '   ', effort: 'Low', interval: '1', unit: 'days' }, // Whitespace title
        { title: 'Task', effort: '', interval: '1', unit: 'days' }, // Missing effort
        { title: 'Task', effort: 'Low', interval: 'invalid', unit: 'days' }, // Invalid interval
        { title: 'Task', effort: 'Low', interval: '-1', unit: 'days' }, // Negative interval
        { title: 'Valid Task', effort: 'Low', interval: '1', unit: 'days' },
      ];

      const result = processImportedTasks(data, existingTasks);

      expect(result.count).toBe(1);
      expect(result.tasksToAdd[0].title).toBe('Valid Task');
    });

    it('handles different effort levels case-insensitively', () => {
      const data = [
        { title: 'Medium Task', effort: 'medium', interval: '1', unit: 'days' },
        { title: 'High Task', effort: 'HIGH', interval: '1', unit: 'days' },
      ];

      const result = processImportedTasks(data, existingTasks);

      expect(result.tasksToAdd[0].level).toBe(EffortLevel.MEDIUM);
      expect(result.tasksToAdd[1].level).toBe(EffortLevel.HIGH);
    });

    it('keeps optional task state fields when provided', () => {
      const data = [
        {
          title: 'Recovered Task',
          effort: 'high',
          interval: '1',
          unit: 'weeks',
          iscompleted: 'true',
          lastcompletedat: '1735689600000',
          nextavailableat: '1735776000000',
        },
      ];

      const result = processImportedTasks(data, existingTasks);

      expect(result.count).toBe(1);
      expect(result.tasksToAdd[0]).toMatchObject({
        title: 'Recovered Task',
        level: EffortLevel.HIGH,
        recurrenceInterval: 1,
        recurrenceUnit: 'weeks',
        isCompleted: true,
        lastCompletedAt: 1735689600000,
        nextAvailableAt: 1735776000000,
      });
      expect(result.tasksToAdd[0].id).toBeDefined();
    });
  });
});
