import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@/types';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from '@/app/actions';
import { useStore } from '@/store/useStore';

export const TASK_QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
};

export function useTasksQuery(initialData?: Task[]) {
  const storeTasks = useStore((state) => state.tasks);

  return useQuery({
    queryKey: TASK_QUERY_KEYS.lists(),
    queryFn: () => storeTasks,
    initialData: initialData ?? (storeTasks.length > 0 ? storeTasks : undefined),
    staleTime: 60 * 1000,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const addTask = useStore((state) => state.addTask);

  return useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'createdAt'> & { createdAt?: number }) => {
      return await createTaskAction(taskData);
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.lists()) ?? [];

      const optimisticTask: Task = {
        ...newTask,
        id: crypto.randomUUID(),
        createdAt: newTask.createdAt ?? Date.now(),
        place: newTask.place || 'Geral',
        isCompleted: newTask.isCompleted ?? false,
      };

      // Optimistically update query cache
      queryClient.setQueryData<Task[]>(TASK_QUERY_KEYS.lists(), (old = []) => [
        optimisticTask,
        ...old,
      ]);

      // Return context with rollback data
      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.lists(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
    onSuccess: (savedTask) => {
      addTask(savedTask);
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const updateStoreTask = useStore((state) => state.updateTask);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      return await updateTaskAction(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.lists()) ?? [];

      queryClient.setQueryData<Task[]>(TASK_QUERY_KEYS.lists(), (old = []) =>
        old.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.lists(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
    onSuccess: (updatedTask, { id, updates }) => {
      if (updatedTask) {
        updateStoreTask(id, updates);
      }
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const deleteStoreTask = useStore((state) => state.deleteTask);

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteTaskAction(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.lists()) ?? [];

      queryClient.setQueryData<Task[]>(TASK_QUERY_KEYS.lists(), (old = []) =>
        old.filter((t) => t.id !== id),
      );

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.lists(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
    onSuccess: (deletedId) => {
      deleteStoreTask(deletedId);
    },
  });
}

export function useToggleTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await toggleTaskAction(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.lists()) ?? [];

      queryClient.setQueryData<Task[]>(TASK_QUERY_KEYS.lists(), (old = []) =>
        old.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
      );

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.lists(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
  });
}
