import { create } from 'zustand';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { StoreState } from '../types';
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  refreshRecurringTasksAction,
  recordTaskCompletionAction,
  addPlaceAction,
  renamePlaceAction,
  deletePlaceAction,
} from '@/app/actions';

export const useStore = create<StoreState>()((set, get) => ({
  tasks: [],
  places: [],
  selectedPlaceFilter: null,
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
      ...(profile?.places ? { places: profile.places } : {}),
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
  setPlaces: (places) => set({ places }),
  setSelectedPlaceFilter: (selectedPlaceFilter) => set({ selectedPlaceFilter }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setSelectedLevel: (selectedLevel) => set({ selectedLevel }),
  setBestStreak: (bestStreak) => set({ bestStreak }),
  setUserName: (userName) => set({ userName }),

  resetStore: () =>
    set({
      tasks: [],
      places: [],
      selectedPlaceFilter: null,
      currentTask: null,
      selectedLevel: null,
      currentStreak: 0,
      bestStreak: 0,
      streakLastUpdatedAt: undefined,
      userEmail: undefined,
      userName: undefined,
    }),

  recordTaskCompletion: (completedAt = Date.now()) => {
    const previousStreak = {
      currentStreak: get().currentStreak,
      bestStreak: get().bestStreak,
      streakLastUpdatedAt: get().streakLastUpdatedAt,
    };

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
        .catch((err) => {
          console.error('Failed to persist streak to DynamoDB', err);
          set(previousStreak);
        });
    }
  },

  addTask: (task) => {
    const taskWithCreated = {
      ...task,
      place: task.place?.trim() || 'Geral',
      createdAt: task.createdAt ?? Date.now(),
    };

    const previousTasks = get().tasks;
    const previousPlaces = get().places;

    set((state) => {
      const newPlaces = state.places.some(
        (p) => p.toLowerCase() === taskWithCreated.place.toLowerCase(),
      )
        ? state.places
        : [...state.places, taskWithCreated.place];

      return {
        tasks: [taskWithCreated, ...state.tasks],
        places: newPlaces,
      };
    });

    if (typeof window !== 'undefined') {
      createTaskAction(taskWithCreated).catch((err) => {
        console.error('Failed to persist task to DynamoDB', err);
        set({ tasks: previousTasks, places: previousPlaces });
      });
    }
  },

  updateTask: (id, updates) => {
    const previousTasks = get().tasks;
    const previousPlaces = get().places;

    set((state) => {
      const trimmedPlace = updates.place?.trim();
      const newPlaces =
        trimmedPlace && !state.places.some((p) => p.toLowerCase() === trimmedPlace.toLowerCase())
          ? [...state.places, trimmedPlace]
          : state.places;

      return {
        places: newPlaces,
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...updates,
            ...(trimmedPlace ? { place: trimmedPlace } : {}),
          };
        }),
      };
    });

    if (typeof window !== 'undefined') {
      updateTaskAction(id, updates).catch((err) => {
        console.error('Failed to update task in DynamoDB', err);
        set({ tasks: previousTasks, places: previousPlaces });
      });
    }
  },

  deleteTask: (id) => {
    const previousTasks = get().tasks;
    const previousCurrentTask = get().currentTask;

    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id);
      if (state.currentTask?.id === id) return { tasks: newTasks, currentTask: null };
      return { tasks: newTasks };
    });

    if (typeof window !== 'undefined') {
      deleteTaskAction(id).catch((err) => {
        console.error('Failed to delete task in DynamoDB', err);
        set({ tasks: previousTasks, currentTask: previousCurrentTask });
      });
    }
  },

  addPlace: async (placeName: string) => {
    const trimmed = placeName.trim();
    if (!trimmed) return;

    const previousPlaces = get().places;

    set((state) => {
      if (state.places.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
        return state;
      }
      return { places: [...state.places, trimmed] };
    });

    if (typeof window !== 'undefined') {
      try {
        const updatedPlaces = await addPlaceAction(trimmed);
        if (updatedPlaces && updatedPlaces.length > 0) {
          set({ places: updatedPlaces });
        }
      } catch (err) {
        console.error('Failed to add place to DynamoDB', err);
        set({ places: previousPlaces });
      }
    }
  },

  renamePlace: async (oldPlace: string, newPlace: string) => {
    const oldTrimmed = oldPlace.trim();
    const newTrimmed = newPlace.trim();
    if (!oldTrimmed || !newTrimmed || oldTrimmed === newTrimmed) return;

    const previousState = {
      places: get().places,
      tasks: get().tasks,
      selectedPlaceFilter: get().selectedPlaceFilter,
    };

    set((state) => ({
      places: state.places.map((p) =>
        p.toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : p,
      ),
      tasks: state.tasks.map((t) =>
        t.place && t.place.toLowerCase() === oldTrimmed.toLowerCase()
          ? { ...t, place: newTrimmed }
          : t,
      ),
      selectedPlaceFilter:
        state.selectedPlaceFilter?.toLowerCase() === oldTrimmed.toLowerCase()
          ? newTrimmed
          : state.selectedPlaceFilter,
    }));

    if (typeof window !== 'undefined') {
      try {
        const result = await renamePlaceAction(oldTrimmed, newTrimmed);
        if (!result.success) {
          set(previousState);
        }
      } catch (err) {
        console.error('Failed to rename place in DynamoDB', err);
        set(previousState);
      }
    }
  },

  deletePlace: async (placeName: string, reassignTo?: string) => {
    const trimmed = placeName.trim();
    const currentTasks = get().tasks;
    const tasksUsingPlace = currentTasks.filter(
      (t) => t.place && t.place.toLowerCase() === trimmed.toLowerCase(),
    );

    if (tasksUsingPlace.length > 0 && !reassignTo) {
      return {
        success: false,
        error: 'place_in_use',
        count: tasksUsingPlace.length,
      };
    }

    const reassignTrimmed = reassignTo?.trim();
    const previousState = {
      places: get().places,
      tasks: get().tasks,
      selectedPlaceFilter: get().selectedPlaceFilter,
    };

    set((state) => ({
      places: state.places.filter((p) => p.toLowerCase() !== trimmed.toLowerCase()),
      tasks: reassignTrimmed
        ? state.tasks.map((t) =>
            t.place && t.place.toLowerCase() === trimmed.toLowerCase()
              ? { ...t, place: reassignTrimmed }
              : t,
          )
        : state.tasks,
      selectedPlaceFilter:
        state.selectedPlaceFilter?.toLowerCase() === trimmed.toLowerCase()
          ? null
          : state.selectedPlaceFilter,
    }));

    if (typeof window !== 'undefined') {
      try {
        const result = await deletePlaceAction(trimmed, reassignTrimmed);
        if (!result.success) {
          set(previousState);
        }
        return result;
      } catch (err) {
        console.error('Failed to delete place from DynamoDB', err);
        set(previousState);
        return { success: false, error: 'network_error' };
      }
    }
    return { success: true };
  },

  refreshRecurringTasks: () => {
    let hasChanges = false;
    set((state) => {
      const now = Date.now();
      const tasks = state.tasks.map((t) => {
        if (t.isCompleted && t.nextAvailableAt && now >= t.nextAvailableAt) {
          hasChanges = true;
          return { ...t, isCompleted: false, nextAvailableAt: undefined };
        }
        return t;
      });
      return hasChanges ? { tasks } : state;
    });

    if (typeof window !== 'undefined' && hasChanges) {
      refreshRecurringTasksAction().catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to refresh tasks in DynamoDB', err);
        }
      });
    }
  },
}));
