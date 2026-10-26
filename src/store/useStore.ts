import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { StoreState } from '../types';
import { STORAGE_KEY } from '../constants';

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      tasks: [],
      currentTask: null,
      selectedLevel: null,
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,

      setTasks: (tasks) => set({ tasks }),
      setCurrentTask: (currentTask) => set({ currentTask }),
      setSelectedLevel: (selectedLevel) => set({ selectedLevel }),
      setBestStreak: (bestStreak) => set({ bestStreak }),
      recordTaskCompletion: (completedAt = Date.now()) =>
        set((state) => {
          const previousUpdate = state.streakLastUpdatedAt;

          if (previousUpdate && isSameDay(previousUpdate, completedAt)) {
            return state.currentStreak > state.bestStreak
              ? { bestStreak: state.currentStreak }
              : {};
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
        }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            return { ...t, ...updates };
          }),
        })),

      deleteTask: (id) =>
        set((state) => {
          const newTasks = state.tasks.filter((t) => t.id !== id);
          if (state.currentTask?.id === id) return { tasks: newTasks, currentTask: null };
          return { tasks: newTasks };
        }),

      refreshRecurringTasks: () =>
        set((state) => {
          const now = Date.now();
          const tasks = state.tasks.map((t) => {
            if (t.isCompleted && t.nextAvailableAt && now >= t.nextAvailableAt) {
              return { ...t, isCompleted: false, nextAvailableAt: undefined };
            }
            return t;
          });
          return { tasks };
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        tasks: state.tasks,
        currentTask: state.currentTask,
        selectedLevel: state.selectedLevel,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        streakLastUpdatedAt: state.streakLastUpdatedAt,
      }),
    },
  ),
);
