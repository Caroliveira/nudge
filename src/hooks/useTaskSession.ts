import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getTasksForLevel, pickRandomTask } from '../utils/taskUtils';

export function useTaskSession() {
  const { tasks, selectedLevel, currentTask, setCurrentTask } = useStore();
  const [seenTaskIds, setSeenTaskIds] = useState<string[]>([]);
  const [isExhausted, setIsExhausted] = useState(false);

  useEffect(() => {
    if (currentTask && seenTaskIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeenTaskIds([currentTask.id]);
    }
  }, [currentTask, seenTaskIds.length]);

  const refreshTask = useCallback(() => {
    if (!selectedLevel) return;

    const allTasksForLevel = getTasksForLevel(tasks, selectedLevel);
    const candidates = allTasksForLevel.filter((t) => !seenTaskIds.includes(t.id));

    const picked = pickRandomTask(candidates);
    if (picked) {
      setCurrentTask(picked);
      setSeenTaskIds((prev) => [...prev, picked.id]);
    } else setIsExhausted(true);
  }, [selectedLevel, tasks, seenTaskIds, setCurrentTask]);

  const resetLevel = useCallback(() => {
    if (!selectedLevel) return;

    setIsExhausted(false);
    setSeenTaskIds([]);

    const candidates = getTasksForLevel(tasks, selectedLevel);
    const picked = pickRandomTask(candidates);
    if (picked) {
      setCurrentTask(picked);
      setSeenTaskIds([picked.id]);
    }
  }, [selectedLevel, tasks, setCurrentTask]);

  return { isExhausted, refreshTask, resetLevel };
}
