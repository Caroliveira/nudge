import { describe, it, expect } from 'vitest';
import { calculateNewStreak } from './streakUtils';

describe('calculateNewStreak', () => {
  it('initializes streak to 1 on first task completion', () => {
    const timestamp = new Date('2026-01-01T10:00:00Z').getTime();
    const result = calculateNewStreak({ currentStreak: 0, bestStreak: 0 }, timestamp);

    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
    expect(result.streakLastUpdatedAt).toBe(timestamp);
  });

  it('preserves currentStreak on same-day completion', () => {
    const day1Morning = new Date('2026-01-01T08:00:00Z').getTime();
    const day1Evening = new Date('2026-01-01T20:00:00Z').getTime();

    const streak1 = calculateNewStreak({ currentStreak: 0, bestStreak: 0 }, day1Morning);
    const streak2 = calculateNewStreak(streak1, day1Evening);

    expect(streak2.currentStreak).toBe(1);
    expect(streak2.bestStreak).toBe(1);
    expect(streak2.streakLastUpdatedAt).toBe(day1Morning);
  });

  it('increments streak on consecutive day completion', () => {
    const day1 = new Date('2026-01-01T12:00:00Z').getTime();
    const day2 = new Date('2026-01-02T12:00:00Z').getTime();
    const day3 = new Date('2026-01-03T09:00:00Z').getTime();

    const s1 = calculateNewStreak({ currentStreak: 0, bestStreak: 0 }, day1);
    expect(s1.currentStreak).toBe(1);

    const s2 = calculateNewStreak(s1, day2);
    expect(s2.currentStreak).toBe(2);
    expect(s2.bestStreak).toBe(2);

    const s3 = calculateNewStreak(s2, day3);
    expect(s3.currentStreak).toBe(3);
    expect(s3.bestStreak).toBe(3);
  });

  it('resets streak to 1 when a day is skipped', () => {
    const day1 = new Date('2026-01-01T12:00:00Z').getTime();
    const day2 = new Date('2026-01-02T12:00:00Z').getTime();
    const day4 = new Date('2026-01-04T12:00:00Z').getTime(); // Skipped day 3

    const s1 = calculateNewStreak({ currentStreak: 0, bestStreak: 0 }, day1);
    const s2 = calculateNewStreak(s1, day2);
    expect(s2.currentStreak).toBe(2);
    expect(s2.bestStreak).toBe(2);

    const sBroken = calculateNewStreak(s2, day4);
    expect(sBroken.currentStreak).toBe(1);
    expect(sBroken.bestStreak).toBe(2); // Best streak preserved!
    expect(sBroken.streakLastUpdatedAt).toBe(day4);
  });

  it('preserves additional object properties when generic type is passed', () => {
    const customProfile = {
      currentStreak: 2,
      bestStreak: 5,
      places: ['Cozinha', 'Quarto'],
      customField: 'preserved',
    };

    const nextDay = new Date('2026-01-02T10:00:00Z').getTime();
    const updated = calculateNewStreak(
      { ...customProfile, streakLastUpdatedAt: new Date('2026-01-01T10:00:00Z').getTime() },
      nextDay,
    );

    expect(updated.currentStreak).toBe(3);
    expect(updated.places).toEqual(['Cozinha', 'Quarto']);
    expect(updated.customField).toBe('preserved');
  });
});
