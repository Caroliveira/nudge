import { useMemo } from 'react';
import { EffortLevel } from '../types';
import { differenceInCalendarDays } from 'date-fns';
import { isTaskAvailable } from '../utils/taskUtils';
import { useStore } from '../store/useStore';

export { isTaskAvailable };

export function useTaskAvailability() {
  const tasks = useStore((state) => state.tasks);
  const { availableCounts, totalIncomplete, nextRefreshDays } = useMemo(() => {
    const counts = {
      [EffortLevel.LOW]: 0,
      [EffortLevel.MEDIUM]: 0,
      [EffortLevel.HIGH]: 0,
    };
    let total = 0;
    let minDays = Infinity;
    let hasRecurring = false;
    const now = new Date();

    for (const task of tasks) {
      // Calculate availability counts
      if (isTaskAvailable(task, now)) {
        if (counts[task.level] !== undefined) counts[task.level]++;
        total++;
      }

      // Calculate next refresh days
      if (task.isCompleted && task.nextAvailableAt) {
        hasRecurring = true;
        const diff = differenceInCalendarDays(task.nextAvailableAt, now);
        if (diff < minDays) minDays = diff;
      }
    }

    const refreshDays = !hasRecurring ? null : minDays > 0 ? minDays : 1;

    return {
      availableCounts: counts,
      totalIncomplete: total,
      nextRefreshDays: refreshDays,
    };
  }, [tasks]);

  return { isTaskAvailable, availableCounts, totalIncomplete, nextRefreshDays };
}
