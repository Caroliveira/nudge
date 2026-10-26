import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCatalogFilter } from './useCatalogFilter';
import { Task, EffortLevel } from '../types';

describe('useCatalogFilter', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'One-time Incomplete',
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
    },
    {
      id: '2',
      title: 'One-time Completed',
      level: EffortLevel.MEDIUM,
      isCompleted: true,
      recurrenceUnit: 'none',
    },
    {
      id: '3',
      title: 'Recurring Incomplete',
      level: EffortLevel.HIGH,
      isCompleted: false,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
    },
    {
      id: '4',
      title: 'Recurring Completed',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'weeks',
      recurrenceInterval: 1,
    },
    {
      id: '5',
      title: 'A Task', // For sorting check
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
    },
  ];

  it('returns all tasks for catalog consumption', () => {
    const { result } = renderHook(() => useCatalogFilter(mockTasks));

    // Should show:
    // - One-time Incomplete (id: 1)
    // - One-time Completed (id: 2)
    // - Recurring Incomplete (id: 3)
    // - Recurring Completed (id: 4)
    // - A Task (id: 5)

    const filteredIds = result.current.sortedTasks.map((t) => t.id);
    expect(filteredIds).toContain('1');
    expect(filteredIds).toContain('2');
    expect(filteredIds).toContain('3');
    expect(filteredIds).toContain('4');
    expect(filteredIds).toContain('5');
    expect(filteredIds.length).toBe(5);
  });

  it('sorts tasks by completion status then title', () => {
    const { result } = renderHook(() => useCatalogFilter(mockTasks));

    // Expected order:
    // 1. Incomplete tasks (sorted by title)
    //    - A Task (id: 5)
    //    - One-time Incomplete (id: 1)
    //    - Recurring Incomplete (id: 3)
    // 2. Completed tasks
    //    - One-time Completed (id: 2)
    //    - Recurring Completed (id: 4)

    const filteredIds = result.current.sortedTasks.map((t) => t.id);
    expect(filteredIds).toEqual(['5', '1', '3', '2', '4']);
  });
});
