import { useMemo } from 'react';
import { isToday } from 'date-fns';
import { Task, EffortLevel, RecurrenceUnit } from '../types';

interface StreakStats {
  currentStreak: number;
  bestStreak: number;
}

export const useCatalogStats = (tasks: Task[], { currentStreak, bestStreak }: StreakStats) => {
  return useMemo(() => {
    const effortDist = {
      [EffortLevel.LOW]: 0,
      [EffortLevel.MEDIUM]: 0,
      [EffortLevel.HIGH]: 0,
    };

    const recurrenceDist: Record<RecurrenceUnit, number> = {
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
      none: 0,
    };

    const totalDone = {
      [EffortLevel.LOW]: 0,
      [EffortLevel.MEDIUM]: 0,
      [EffortLevel.HIGH]: 0,
    };
    const totalLeft = {
      [EffortLevel.LOW]: 0,
      [EffortLevel.MEDIUM]: 0,
      [EffortLevel.HIGH]: 0,
    };

    let hasActivityToday = false;
    const registeredUnits = new Set<RecurrenceUnit>();

    tasks.forEach((task) => {
      const unit = task.recurrenceUnit || 'none';
      registeredUnits.add(unit);

      // Activity Today Logic
      if (task.isCompleted && task.lastCompletedAt && isToday(task.lastCompletedAt)) {
        effortDist[task.level]++;
        recurrenceDist[unit] = (recurrenceDist[unit] || 0) + 1;
        hasActivityToday = true;
      }

      // Catalog Status Logic
      if (task.isCompleted) {
        totalDone[task.level]++;
      } else {
        totalLeft[task.level]++;
      }
    });

    return {
      effortDist,
      recurrenceDist,
      totalDone,
      totalLeft,
      hasActivityToday,
      registeredUnits,
      currentStreak,
      bestStreak,
    };
  }, [tasks, currentStreak, bestStreak]);
};
