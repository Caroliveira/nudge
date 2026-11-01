import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskSession } from './useTaskSession';
import { useStore } from '../store/useStore';
import { getTasksForLevel, pickRandomTask } from '../utils/taskUtils';
import { Task, EffortLevel } from '../types';

// Mock dependencies
vi.mock('../store/useStore');
vi.mock('../utils/taskUtils');

describe('useTaskSession', () => {
  const mockSetCurrentTask = vi.fn();
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      place: 'Geral',
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
      createdAt: Date.now(),
    },
    {
      id: '2',
      title: 'Task 2',
      place: 'Geral',
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
      createdAt: Date.now(),
    },
    {
      id: '3',
      title: 'Task 3',
      place: 'Geral',
      level: EffortLevel.LOW,
      isCompleted: false,
      recurrenceUnit: 'none',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: null,
      setCurrentTask: mockSetCurrentTask,
    });
    (getTasksForLevel as any).mockReturnValue(mockTasks);
    (pickRandomTask as any).mockImplementation((tasks: Task[]) => tasks[0] || null);
  });

  it('initializes correctly', () => {
    const { result } = renderHook(() => useTaskSession());
    expect(result.current.isExhausted).toBe(false);
  });

  it('adds currentTask to seenTaskIds on mount if present', () => {
    (useStore as any).mockReturnValue({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
      setCurrentTask: mockSetCurrentTask,
    });
  });

  it('refreshTask picks a new task and adds to seen', () => {
    const { result } = renderHook(() => useTaskSession());

    // First refresh
    act(() => {
      result.current.refreshTask();
    });

    expect(getTasksForLevel).toHaveBeenCalledWith(mockTasks, EffortLevel.LOW);
    // Should filter out nothing initially (empty seen)
    expect(pickRandomTask).toHaveBeenCalled();
    expect(mockSetCurrentTask).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('refreshTask handles exhaustion', () => {
    (pickRandomTask as any).mockReturnValue(null); // No task found

    const { result } = renderHook(() => useTaskSession());

    act(() => {
      result.current.refreshTask();
    });

    expect(result.current.isExhausted).toBe(true);
  });

  it('resetLevel resets state and picks new task', () => {
    const { result } = renderHook(() => useTaskSession());

    // Exhaust it first
    act(() => {
      (pickRandomTask as any).mockReturnValue(null);
      result.current.refreshTask();
    });
    expect(result.current.isExhausted).toBe(true);

    // Reset
    (pickRandomTask as any).mockReturnValue(mockTasks[1]);
    act(() => {
      result.current.resetLevel();
    });

    expect(result.current.isExhausted).toBe(false);
    expect(mockSetCurrentTask).toHaveBeenCalledWith(mockTasks[1]);
    // seenTaskIds should be reset, so next refresh should consider all tasks again
  });
});
