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
  isCompleted?: boolean;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  lastCompletedAt?: number;
  nextAvailableAt?: number;
}

export interface StoreState {
  // State
  tasks: Task[];
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
    profile?: { currentStreak: number; bestStreak: number; streakLastUpdatedAt?: number },
    userEmail?: string,
    userName?: string,
  ) => void;
  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  setSelectedLevel: (level: EffortLevel | null) => void;
  setBestStreak: (bestStreak: number) => void;
  setUserName: (userName: string) => void;
  recordTaskCompletion: (completedAt?: number) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  refreshRecurringTasks: () => void;
  resetStore: () => void;
}

export interface CsvTaskRow {
  title: string;
  effort: string;
  interval: string;
  unit: string;
  iscompleted?: string;
  lastcompletedat?: string;
  nextavailableat?: string;
}
