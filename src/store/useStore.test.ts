import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useStore } from './useStore';
import { EffortLevel, Task } from '../types';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      tasks: [],
      currentTask: null,
      selectedLevel: null,
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets tasks correctly', () => {
    const tasks = [{ id: '1', title: 'Task', level: EffortLevel.LOW } as Task];
    useStore.getState().setTasks(tasks);
    expect(useStore.getState().tasks).toEqual(tasks);
  });

  it('sets current task correctly', () => {
    const task = { id: '1', title: 'Task', level: EffortLevel.LOW } as Task;
    useStore.getState().setCurrentTask(task);
    expect(useStore.getState().currentTask).toEqual(task);
  });

  it('sets selected level correctly', () => {
    useStore.getState().setSelectedLevel(EffortLevel.HIGH);
    expect(useStore.getState().selectedLevel).toBe(EffortLevel.HIGH);
  });

  it('sets best streak correctly', () => {
    useStore.getState().setBestStreak(7);
    expect(useStore.getState().bestStreak).toBe(7);
  });

  it('records task completions in the streak state', () => {
    useStore.getState().recordTaskCompletion(new Date('2024-01-01T12:00:00Z').getTime());
    useStore.getState().recordTaskCompletion(new Date('2024-01-02T12:00:00Z').getTime());

    expect(useStore.getState().currentStreak).toBe(2);
    expect(useStore.getState().bestStreak).toBe(2);
    expect(useStore.getState().streakLastUpdatedAt).toBe(
      new Date('2024-01-02T12:00:00Z').getTime(),
    );
  });

  it('does not count multiple completions on the same day as a new streak day', () => {
    useStore.getState().recordTaskCompletion(new Date('2024-01-01T08:00:00Z').getTime());
    useStore.getState().recordTaskCompletion(new Date('2024-01-01T12:00:00Z').getTime());

    expect(useStore.getState().currentStreak).toBe(1);
    expect(useStore.getState().bestStreak).toBe(1);
  });

  it('adds a task correctly', () => {
    const taskData = {
      id: 'test-uuid',
      title: 'New Task',
      level: EffortLevel.MEDIUM,
      recurrenceUnit: 'none' as const,
      recurrenceInterval: 1,
      createdAt: Date.now(),
    };

    useStore.getState().addTask(taskData);

    const { tasks } = useStore.getState();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject(taskData);
  });

  it('updates a task correctly', () => {
    const taskData = {
      id: 'test-uuid',
      title: 'Task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none' as const,
      recurrenceInterval: 1,
      createdAt: Date.now(),
    };
    useStore.getState().addTask(taskData);

    useStore.getState().updateTask('test-uuid', { title: 'Updated Task' });

    const { tasks } = useStore.getState();
    expect(tasks[0].title).toBe('Updated Task');
  });

  it('deletes a task correctly', () => {
    const taskData = {
      id: 'test-uuid',
      title: 'Task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none' as const,
      recurrenceInterval: 1,
      createdAt: Date.now(),
    };
    useStore.getState().addTask(taskData);

    useStore.getState().deleteTask('test-uuid');

    const { tasks } = useStore.getState();
    expect(tasks).toHaveLength(0);
  });

  it('clears currentTask if the deleted task was selected', () => {
    const taskData = {
      id: 'test-uuid',
      title: 'Task',
      level: EffortLevel.LOW,
      recurrenceUnit: 'none' as const,
      recurrenceInterval: 1,
      createdAt: Date.now(),
    };
    useStore.getState().addTask(taskData);
    const task = useStore.getState().tasks[0];
    useStore.getState().setCurrentTask(task);

    useStore.getState().deleteTask('test-uuid');

    const { currentTask } = useStore.getState();
    expect(currentTask).toBeNull();
  });

  it('refreshes recurring tasks that are due', () => {
    const pastDate = new Date('2020-01-01').getTime();
    const task: Task = {
      id: 'recurring-task',
      title: 'Recurring',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
      lastCompletedAt: pastDate,
      nextAvailableAt: pastDate,
    };

    useStore.setState({ tasks: [task] });

    useStore.getState().refreshRecurringTasks();

    const { tasks } = useStore.getState();
    expect(tasks[0].isCompleted).toBe(false);
    expect(tasks[0].nextAvailableAt).toBeUndefined();
  });

  it('does not refresh recurring tasks that are not yet due', () => {
    const futureDate = Date.now() + 100000;
    const task: Task = {
      id: 'recurring-task',
      title: 'Recurring',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
      lastCompletedAt: Date.now(),
      nextAvailableAt: futureDate,
    };

    useStore.setState({ tasks: [task] });

    useStore.getState().refreshRecurringTasks();

    const { tasks } = useStore.getState();
    expect(tasks[0].isCompleted).toBe(true);
  });
});
