import { EffortLevel, RecurrenceUnit } from './types';

export const APP_ROUTES = {
  HOME: '/',
  TASK: '/task',
  CATALOG: '/catalog',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

export const SESSION_COOKIE_NAME = 'nudge_session';

export const IMPORT_CONFIG = {
  MAX_FILE_SIZE_BYTES: 1024 * 1024, // 1MB
  STATUS_MESSAGE_DURATION_MS: 5000,
} as const;

export const SWIPE_CONFIG = {
  THRESHOLD_PX: 150,
  DRAG_CONSTRAINT_PX: 300,
  DRAG_END_TIMEOUT_MS: 50,
} as const;

export const EFFORT_LABELS: Record<EffortLevel, string> = {
  [EffortLevel.LOW]: 'effort.low',
  [EffortLevel.MEDIUM]: 'effort.medium',
  [EffortLevel.HIGH]: 'effort.high',
};

export const SWIPE_ACTIONS = {
  DELETE: {
    threshold: -150,
    baseText: 'swipe.delete',
    activeText: 'swipe.releaseDelete',
    baseColor: 'rgb(239, 68, 68)', // red-500
    activeColor: 'rgb(220, 38, 38)', // red-600
    successText: 'swipe.deleted',
    alignment: 'end' as const,
  },
  EDIT: {
    threshold: 150,
    baseText: 'swipe.edit',
    activeText: 'swipe.releaseEdit',
    successText: 'swipe.editing',
    baseColor: 'rgb(59, 130, 246)', // blue-500
    activeColor: 'rgb(37, 99, 235)', // blue-600
    alignment: 'start' as const,
  },
} as const;

export const EFFORT_COLORS = {
  [EffortLevel.LOW]: 'text-green-600 bg-green-100',
  [EffortLevel.MEDIUM]: 'text-amber-600 bg-amber-100',
  [EffortLevel.HIGH]: 'text-red-600 bg-red-100',
};

export const EFFORT_BAR_COLORS = {
  [EffortLevel.LOW]: 'bg-green-500',
  [EffortLevel.MEDIUM]: 'bg-amber-500',
  [EffortLevel.HIGH]: 'bg-red-500',
};

export const RECURRENCE_LABELS: Record<RecurrenceUnit, string> = {
  days: 'recurrence.days',
  weeks: 'recurrence.weeks',
  months: 'recurrence.months',
  years: 'recurrence.years',
  none: 'recurrence.none',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
] as const;
