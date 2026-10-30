import { create } from 'zustand';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { StoreState } from '../types';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  refreshRecurringTasksAction,
  recordTaskCompletionAction,
} from '@/app/actions';

export const useStore = create<StoreState>()((set) => ({
  tasks: [],
  currentTask: null,
  selectedLevel: null,
  currentStreak: 0,
  bestStreak: 0,
  streakLastUpdatedAt: undefined,
  userEmail: undefined,
  userName: undefined,

  initializeFromSSR: (tasks, profile, userEmail, userName) =>
    set({
      tasks,
      ...(userEmail ? { userEmail } : {}),
      ...(userName ? { userName } : {}),
      ...(profile
        ? {
            currentStreak: profile.currentStreak,
            bestStreak: profile.bestStreak,
            streakLastUpdatedAt: profile.streakLastUpdatedAt,
          }
        : {}),
    }),

  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setSelectedLevel: (selectedLevel) => set({ selectedLevel }),
  setBestStreak: (bestStreak) => set({ bestStreak }),

  resetStore: () =>
    set({
      tasks: [],
      currentTask: null,
      selectedLevel: null,
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,
      userEmail: undefined,
      userName: undefined,
    }),

  recordTaskCompletion: (completedAt = Date.now()) => {
    set((state) => {
      const previousUpdate = state.streakLastUpdatedAt;

      if (previousUpdate && isSameDay(previousUpdate, completedAt)) {
        return state.currentStreak > state.bestStreak ? { bestStreak: state.currentStreak } : {};
      }

      const currentStreak =
        previousUpdate && differenceInCalendarDays(completedAt, previousUpdate) === 1
          ? state.currentStreak + 1
          : 1;

      return {
        currentStreak,
        bestStreak: Math.max(state.bestStreak, currentStreak),
        streakLastUpdatedAt: completedAt,
      };
    });

    if (typeof window !== 'undefined') {
      recordTaskCompletionAction(completedAt)
        .then((profile) => {
          if (profile) {
            set({
              currentStreak: profile.currentStreak,
              bestStreak: profile.bestStreak,
              streakLastUpdatedAt: profile.streakLastUpdatedAt,
            });
          }
        })
        .catch((err) => console.error('Failed to persist streak to DynamoDB', err));
    }
  },

  addTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
    if (typeof window !== 'undefined') {
      createTaskAction(task).catch((err) =>
        console.error('Failed to persist task to DynamoDB', err),
      );
    }
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        return { ...t, ...updates };
      }),
    }));
    if (typeof window !== 'undefined') {
      updateTaskAction(id, updates).catch((err) =>
        console.error('Failed to update task in DynamoDB', err),
      );
    }
  },

  deleteTask: (id) => {
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id);
      if (state.currentTask?.id === id) return { tasks: newTasks, currentTask: null };
      return { tasks: newTasks };
    });
    if (typeof window !== 'undefined') {
      deleteTaskAction(id).catch((err) => console.error('Failed to delete task in DynamoDB', err));
    }
  },

  refreshRecurringTasks: () => {
    set((state) => {
      const now = Date.now();
      const tasks = state.tasks.map((t) => {
        if (t.isCompleted && t.nextAvailableAt && now >= t.nextAvailableAt) {
          return { ...t, isCompleted: false, nextAvailableAt: undefined };
        }
        return t;
      });
      return { tasks };
    });
    if (typeof window !== 'undefined') {
      refreshRecurringTasksAction().catch((err) =>
        console.error('Failed to refresh tasks in DynamoDB', err),
      );
    }
  },
}));
