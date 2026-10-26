import { useMemo } from 'react';
import { Task } from '../types';

export type CatalogView = 'tasks' | 'report';

export function useCatalogFilter(tasks: Task[]) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) =>
      a.isCompleted !== b.isCompleted ? (a.isCompleted ? 1 : -1) : a.title.localeCompare(b.title),
    );
  }, [tasks]);

  return { sortedTasks };
}
