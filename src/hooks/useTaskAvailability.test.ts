import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTaskAvailability } from './useTaskAvailability';
import { EffortLevel, Task } from '../types';
import { addDays } from 'date-fns';
import { useStore } from '../store/useStore';

vi.mock('../store/useStore');

describe('useTaskAvailability', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      level: EffortLevel.LOW,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
    },
    {
      id: '2',
      title: 'Task 2',
      level: EffortLevel.MEDIUM,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
    },
    {
      id: '3',
      title: 'Task 3',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
    (useStore as any).mockImplementation((selector: any) => selector({ tasks: mockTasks }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calculates available counts correctly', () => {
    const { result } = renderHook(() => useTaskAvailability());

    expect(result.current.availableCounts[EffortLevel.LOW]).toBe(1);
    expect(result.current.availableCounts[EffortLevel.MEDIUM]).toBe(1);
    expect(result.current.availableCounts[EffortLevel.HIGH]).toBe(0);
    expect(result.current.totalIncomplete).toBe(2);
  });

  it('calculates next refresh days correctly', () => {
    const futureDate = addDays(new Date(), 2).getTime();
    const recurringTask: Task = {
      ...mockTasks[2],
      nextAvailableAt: futureDate,
    };

    (useStore as any).mockImplementation((selector: any) =>
      selector({ tasks: [...mockTasks.slice(0, 2), recurringTask] }),
    );

    const { result } = renderHook(() => useTaskAvailability());

    expect(result.current.nextRefreshDays).toBe(2);
  });

  it('returns null for nextRefreshDays if no recurring tasks', () => {
    const noRecurringTasks = mockTasks.map((t) => ({ ...t, recurrenceUnit: 'none' as const }));
    (useStore as any).mockImplementation((selector: any) => selector({ tasks: noRecurringTasks }));

    const { result } = renderHook(() => useTaskAvailability());

    expect(result.current.nextRefreshDays).toBeNull();
  });
});
