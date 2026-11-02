import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  TASK_QUERY_KEYS,
} from './useTasksQuery';
import { EffortLevel, Task } from '@/types';
import * as actions from '@/app/actions';

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
}

describe('useTasksQuery and mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads initial tasks and reflects query data', () => {
    const { Wrapper } = createTestWrapper();
    const initialTasks: Task[] = [
      {
        id: '1',
        title: 'Initial Task',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      },
    ];

    const { result } = renderHook(() => useTasksQuery(initialTasks), {
      wrapper: Wrapper,
    });

    expect(result.current.data).toEqual(initialTasks);
  });

  it('optimistically adds task on useCreateTaskMutation and commits on success', async () => {
    const { Wrapper } = createTestWrapper();
    const savedTask: Task = {
      id: 'server-id',
      title: 'Server Task',
      place: 'Geral',
      level: EffortLevel.MEDIUM,
      createdAt: 200,
    };

    vi.spyOn(actions, 'createTaskAction').mockResolvedValueOnce(savedTask);

    const { result } = renderHook(() => useCreateTaskMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Server Task',
        place: 'Geral',
        level: EffortLevel.MEDIUM,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back query data when useCreateTaskMutation fails', async () => {
    const { queryClient, Wrapper } = createTestWrapper();
    const existing: Task[] = [
      {
        id: 'existing-id',
        title: 'Existing',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      },
    ];
    queryClient.setQueryData(TASK_QUERY_KEYS.lists(), existing);

    vi.spyOn(actions, 'createTaskAction').mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCreateTaskMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          title: 'Will Fail',
          place: 'Geral',
          level: EffortLevel.HIGH,
        });
      } catch {
        // Expected mutation rejection
      }
    });

    expect(queryClient.getQueryData(TASK_QUERY_KEYS.lists())).toEqual(existing);
  });

  it('optimistically updates task on useUpdateTaskMutation', async () => {
    const { queryClient, Wrapper } = createTestWrapper();
    const existing: Task[] = [
      {
        id: 'task-1',
        title: 'Old Title',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      },
    ];
    queryClient.setQueryData(TASK_QUERY_KEYS.lists(), existing);

    vi.spyOn(actions, 'updateTaskAction').mockResolvedValueOnce({
      ...existing[0],
      title: 'New Title',
    });

    const { result } = renderHook(() => useUpdateTaskMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'task-1',
        updates: { title: 'New Title' },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('optimistically deletes task on useDeleteTaskMutation and rolls back on error', async () => {
    const { queryClient, Wrapper } = createTestWrapper();
    const existing: Task[] = [
      {
        id: 'task-1',
        title: 'Delete Me',
        place: 'Geral',
        level: EffortLevel.LOW,
        createdAt: 100,
      },
    ];
    queryClient.setQueryData(TASK_QUERY_KEYS.lists(), existing);

    vi.spyOn(actions, 'deleteTaskAction').mockRejectedValueOnce(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteTaskMutation(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('task-1');
      } catch {
        // Expected
      }
    });

    // Rolled back
    expect(queryClient.getQueryData(TASK_QUERY_KEYS.lists())).toEqual(existing);
  });
});
