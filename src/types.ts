export enum EffortLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type RecurrenceUnit = 'days' | 'weeks' | 'months' | 'years' | 'none';
export type RecurringUnit = Exclude<RecurrenceUnit, 'none'>;

export interface Task {
  id: string;
  title: string;
  level: EffortLevel;
  place: string;
  isCompleted?: boolean;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  lastCompletedAt?: number;
  nextAvailableAt?: number;
  createdAt: number;
}

export interface StoreState {
  // State
  tasks: Task[];
  places: string[];
  selectedPlaceFilter: string | null;
  currentTask: Task | null;
  selectedLevel: EffortLevel | null;
  currentStreak: number;
  bestStreak: number;
  streakLastUpdatedAt?: number;
  userEmail?: string;
  userName?: string;

  // Actions
  initializeFromSSR: (
    tasks: Task[],
    profile?: {
      currentStreak: number;
      bestStreak: number;
      streakLastUpdatedAt?: number;
      places?: string[];
    },
    userEmail?: string,
    userName?: string,
  ) => void;
  setTasks: (tasks: Task[]) => void;
  setPlaces: (places: string[]) => void;
  setSelectedPlaceFilter: (place: string | null) => void;
  setCurrentTask: (task: Task | null) => void;
  setSelectedLevel: (level: EffortLevel | null) => void;
  setBestStreak: (bestStreak: number) => void;
  setUserName: (userName: string) => void;
  recordTaskCompletion: (completedAt?: number) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  addPlace: (place: string) => Promise<void>;
  renamePlace: (oldPlace: string, newPlace: string) => Promise<void>;
  deletePlace: (
    place: string,
    reassignTo?: string,
  ) => Promise<{ success: boolean; error?: string; count?: number }>;
  refreshRecurringTasks: () => void;
  resetStore: () => void;
}

export interface CsvTaskRow {
  title: string;
  effort: string;
  place?: string;
  interval: string;
  unit: string;
  iscompleted?: string;
  lastcompletedat?: string;
  nextavailableat?: string;
}
