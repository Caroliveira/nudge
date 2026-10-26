import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCatalogStats } from './useCatalogStats';
import { Task, EffortLevel } from '../types';

describe('useCatalogStats', () => {
  const today = new Date('2024-01-01T12:00:00Z');
  const yesterday = new Date('2023-12-31T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Low Effort Done Today',
      level: EffortLevel.LOW,
      isCompleted: true,
      lastCompletedAt: today.getTime(),
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
    },
    {
      id: '2',
      title: 'Medium Effort Done Yesterday',
      level: EffortLevel.MEDIUM,
      isCompleted: true,
      lastCompletedAt: yesterday.getTime(),
      recurrenceUnit: 'weeks',
      recurrenceInterval: 1,
    },
    {
      id: '3',
      title: 'High Effort Incomplete',
      level: EffortLevel.HIGH,
      isCompleted: false,
      recurrenceUnit: 'none',
    },
    {
      id: '4',
      title: 'Low Effort Incomplete',
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
    },
  ];

  it('calculates stats correctly', () => {
    const { result } = renderHook(() =>
      useCatalogStats(mockTasks, {
        currentStreak: 2,
        bestStreak: 5,
      }),
    );

    // effortDist (completed today)
    expect(result.current.effortDist[EffortLevel.LOW]).toBe(1);
    expect(result.current.effortDist[EffortLevel.MEDIUM]).toBe(0); // completed yesterday
    expect(result.current.effortDist[EffortLevel.HIGH]).toBe(0);

    // recurrenceDist (completed today)
    expect(result.current.recurrenceDist['days']).toBe(1);
    expect(result.current.recurrenceDist['weeks']).toBe(0); // completed yesterday
    expect(result.current.recurrenceDist['none']).toBe(0);

    // totalDone (all completed)
    expect(result.current.totalDone[EffortLevel.LOW]).toBe(1);
    expect(result.current.totalDone[EffortLevel.MEDIUM]).toBe(1);
    expect(result.current.totalDone[EffortLevel.HIGH]).toBe(0);

    // totalLeft (incomplete)
    expect(result.current.totalLeft[EffortLevel.LOW]).toBe(1);
    expect(result.current.totalLeft[EffortLevel.MEDIUM]).toBe(0);
    expect(result.current.totalLeft[EffortLevel.HIGH]).toBe(1);

    // hasActivityToday
    expect(result.current.hasActivityToday).toBe(true);
    expect(result.current.currentStreak).toBe(2);
    expect(result.current.bestStreak).toBe(5);

    // registeredUnits
    expect(result.current.registeredUnits.has('days')).toBe(true);
    expect(result.current.registeredUnits.has('weeks')).toBe(true);
    expect(result.current.registeredUnits.has('none')).toBe(true);
  });

  it('handles empty tasks', () => {
    const { result } = renderHook(() =>
      useCatalogStats([], {
        currentStreak: 0,
        bestStreak: 0,
      }),
    );

    expect(result.current.hasActivityToday).toBe(false);
    expect(result.current.totalDone[EffortLevel.LOW]).toBe(0);
    expect(result.current.totalLeft[EffortLevel.LOW]).toBe(0);
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.bestStreak).toBe(0);
  });

  it('returns zero current streak when there is a break after yesterday', () => {
    const olderTasks: Task[] = [
      {
        id: '1',
        title: 'Done two days ago',
        level: EffortLevel.LOW,
        isCompleted: true,
        lastCompletedAt: new Date('2023-12-30T12:00:00Z').getTime(),
      },
    ];

    const { result } = renderHook(() =>
      useCatalogStats(olderTasks, {
        currentStreak: 0,
        bestStreak: 0,
      }),
    );
    expect(result.current.currentStreak).toBe(0);
    expect(result.current.bestStreak).toBe(0);
  });
});
