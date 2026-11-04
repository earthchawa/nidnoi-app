import { addDays } from './date.ts';

export interface Streak {
  /** Consecutive active days ending today, or ending yesterday if today isn't done yet. */
  current: number;
  activeToday: boolean;
}

/**
 * A streak stays alive until the end of the day after the last active day,
 * so missing a whole day resets it to 0.
 */
export function computeStreak(activeDates: Iterable<string>, today: string): Streak {
  const active = new Set(activeDates);
  const activeToday = active.has(today);
  let day = activeToday ? today : addDays(today, -1);
  let current = 0;
  while (active.has(day)) {
    current++;
    day = addDays(day, -1);
  }
  return { current, activeToday };
}
