import { differenceInCalendarDays, isSameDay } from 'date-fns';

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  streakLastUpdatedAt?: number;
}

/**
 * Calculates new streak stats following Nudge rules:
 * - Same day completions preserve streak (and update bestStreak if currentStreak > bestStreak).
 * - Consecutive day completions increment streak by 1.
 * - Missed days reset streak back to 1.
 */
export function calculateNewStreak<T extends StreakState>(
  profile: T,
  completedAt = Date.now(),
): T & StreakState {
  const previousUpdate = profile.streakLastUpdatedAt;

  if (previousUpdate && isSameDay(previousUpdate, completedAt)) {
    return {
      ...profile,
      bestStreak: Math.max(profile.bestStreak, profile.currentStreak),
    };
  }

  const currentStreak =
    previousUpdate && differenceInCalendarDays(completedAt, previousUpdate) === 1
      ? profile.currentStreak + 1
      : 1;

  return {
    ...profile,
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    streakLastUpdatedAt: completedAt,
  };
}
