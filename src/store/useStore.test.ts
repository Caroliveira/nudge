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
      place: 'Geral',
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
      place: 'Geral',
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
      place: 'Geral',
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
      place: 'Geral',
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
      place: 'Geral',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
      lastCompletedAt: pastDate,
      nextAvailableAt: pastDate,
      createdAt: pastDate,
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
      place: 'Geral',
      level: EffortLevel.LOW,
      isCompleted: true,
      recurrenceUnit: 'days',
      recurrenceInterval: 1,
      lastCompletedAt: Date.now(),
      nextAvailableAt: futureDate,
      createdAt: Date.now(),
    };

    useStore.setState({ tasks: [task] });

    useStore.getState().refreshRecurringTasks();

    const { tasks } = useStore.getState();
    expect(tasks[0].isCompleted).toBe(true);
  });

  it('resets the store to initial empty values', () => {
    useStore.setState({
      tasks: [{ id: '1', title: 'Task', level: EffortLevel.LOW } as Task],
      currentTask: { id: '1', title: 'Task', level: EffortLevel.LOW } as Task,
      selectedLevel: EffortLevel.LOW,
      currentStreak: 5,
      bestStreak: 10,
      streakLastUpdatedAt: Date.now(),
      userEmail: 'user@example.com',
    });

    useStore.getState().resetStore();

    const state = useStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.currentTask).toBeNull();
    expect(state.selectedLevel).toBeNull();
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.streakLastUpdatedAt).toBeUndefined();
    expect(state.userEmail).toBeUndefined();
  });

  it('updates userName via setUserName', () => {
    useStore.getState().setUserName('Novo Nome');
    expect(useStore.getState().userName).toBe('Novo Nome');
  });

  describe('optimistic updates & rollback on server error', () => {
    it('rolls back addTask when createTaskAction fails', async () => {
      const actions = await import('@/app/actions');
      vi.spyOn(actions, 'createTaskAction').mockRejectedValueOnce(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const initialTask: Task = {
        id: 'initial-task',
        title: 'Initial',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      };
      useStore.setState({ tasks: [initialTask], places: ['Geral'] });

      useStore.getState().addTask({
        id: 'new-task',
        title: 'New',
        place: 'Cozinha',
        level: EffortLevel.HIGH,
        createdAt: 200,
      });

      // Immediately optimistic
      expect(useStore.getState().tasks).toHaveLength(2);

      // Wait for promise rejection to handle rollback
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(useStore.getState().tasks).toHaveLength(1);
      expect(useStore.getState().tasks[0].id).toBe('initial-task');
      expect(useStore.getState().places).toEqual(['Geral']);
    });

    it('rolls back updateTask when updateTaskAction fails', async () => {
      const actions = await import('@/app/actions');
      vi.spyOn(actions, 'updateTaskAction').mockRejectedValueOnce(new Error('DB error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const initialTask: Task = {
        id: 'task-1',
        title: 'Original Title',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      };
      useStore.setState({ tasks: [initialTask] });

      useStore.getState().updateTask('task-1', { title: 'Changed Title' });
      expect(useStore.getState().tasks[0].title).toBe('Changed Title');

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(useStore.getState().tasks[0].title).toBe('Original Title');
    });

    it('rolls back deleteTask when deleteTaskAction fails', async () => {
      const actions = await import('@/app/actions');
      vi.spyOn(actions, 'deleteTaskAction').mockRejectedValueOnce(new Error('Delete error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const initialTask: Task = {
        id: 'task-1',
        title: 'Keep me',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      };
      useStore.setState({ tasks: [initialTask], currentTask: initialTask });

      useStore.getState().deleteTask('task-1');
      expect(useStore.getState().tasks).toHaveLength(0);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(useStore.getState().tasks).toHaveLength(1);
      expect(useStore.getState().tasks[0].id).toBe('task-1');
      expect(useStore.getState().currentTask?.id).toBe('task-1');
    });
  });
});
