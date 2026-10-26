import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskActions } from './useTaskActions';
import { useStore } from '../store/useStore';
import { EffortLevel, Task } from '../types';
import { APP_ROUTES } from '../constants';

const mockNavigate = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockNavigate,
  }),
}));

describe('useTaskActions', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
    },
    {
      id: '2',
      title: 'Task 2',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none',
    },
    {
      id: '3',
      title: 'Task 3',
      level: EffortLevel.HIGH,
      recurrenceUnit: 'none',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      tasks: [],
      currentTask: null,
      selectedLevel: null,
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selectLevel picks a random task and navigates', () => {
    useStore.setState({ tasks: mockTasks });
    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.selectLevel(EffortLevel.LOW);
    });

    const state = useStore.getState();
    expect(state.selectedLevel).toBe(EffortLevel.LOW);
    expect(state.currentTask).not.toBeNull();
    expect(state.currentTask?.level).toBe(EffortLevel.LOW);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.TASK);
  });

  it('selectLevel does nothing if no tasks available', () => {
    useStore.setState({ tasks: [] });
    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.selectLevel(EffortLevel.LOW);
    });

    const state = useStore.getState();
    expect(state.selectedLevel).toBeNull();
    expect(state.currentTask).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('backToSelection clears state and navigates home', () => {
    useStore.setState({
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
    });

    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.backToSelection();
    });

    const state = useStore.getState();
    expect(state.selectedLevel).toBeNull();
    expect(state.currentTask).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.HOME);
  });

  it('toggleTask updates task completion status', () => {
    useStore.setState({ tasks: mockTasks });
    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.toggleTask('1');
    });

    const state = useStore.getState();
    const task = state.tasks.find((t) => t.id === '1');
    expect(task?.isCompleted).toBe(true);
  });

  it('markTaskDone completes current task and checks for level completion', () => {
    useStore.setState({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
      bestStreak: 0,
    });

    const { result } = renderHook(() => useTaskActions());

    let response;
    act(() => {
      response = result.current.markTaskDone();
    });

    const state = useStore.getState();
    const task = state.tasks.find((t) => t.id === '1');
    expect(task?.isCompleted).toBe(true);

    expect(response).toEqual({ levelCleared: false });
  });

  it('updates bestStreak when completing a task extends the streak', () => {
    const today = new Date('2024-01-02T12:00:00Z');
    const yesterday = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(today);

    useStore.setState({
      tasks: [mockTasks[0], mockTasks[1], mockTasks[2]],
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
      currentStreak: 1,
      bestStreak: 1,
      streakLastUpdatedAt: yesterday.getTime(),
    });

    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.markTaskDone();
    });

    expect(useStore.getState().bestStreak).toBe(2);
    expect(useStore.getState().currentStreak).toBe(2);
    expect(useStore.getState().streakLastUpdatedAt).toBe(today.getTime());
  });

  it('does not increment the streak more than once in the same day', () => {
    const today = new Date('2024-01-02T12:00:00Z');
    vi.setSystemTime(today);

    useStore.setState({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
      currentStreak: 4,
      bestStreak: 4,
      streakLastUpdatedAt: new Date('2024-01-02T08:00:00Z').getTime(),
    });

    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.markTaskDone();
    });

    expect(useStore.getState().currentStreak).toBe(4);
    expect(useStore.getState().bestStreak).toBe(4);
  });

  it('starts a new current streak without lowering the historical best', () => {
    const today = new Date('2024-01-05T12:00:00Z');
    vi.setSystemTime(today);

    useStore.setState({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: mockTasks[0],
      currentStreak: 4,
      bestStreak: 4,
      streakLastUpdatedAt: new Date('2024-01-01T12:00:00Z').getTime(),
    });

    const { result } = renderHook(() => useTaskActions());

    act(() => {
      result.current.markTaskDone();
    });

    expect(useStore.getState().currentStreak).toBe(1);
    expect(useStore.getState().bestStreak).toBe(4);
    expect(useStore.getState().streakLastUpdatedAt).toBe(today.getTime());
  });

  it('markTaskDone returns levelCleared true when last task is finished', () => {
    const tasks = [{ ...mockTasks[0] }, { ...mockTasks[1], isCompleted: true }];

    useStore.setState({
      tasks: tasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: tasks[0],
    });

    const { result } = renderHook(() => useTaskActions());

    let response;
    act(() => {
      response = result.current.markTaskDone();
    });

    expect(response).toEqual({ levelCleared: true });
  });

  it('markTaskDone does nothing if no current task', () => {
    useStore.setState({
      tasks: mockTasks,
      selectedLevel: EffortLevel.LOW,
      currentTask: null,
    });

    const { result } = renderHook(() => useTaskActions());

    let response;
    act(() => {
      response = result.current.markTaskDone();
    });

    expect(response).toEqual({ levelCleared: false });
  });
});
