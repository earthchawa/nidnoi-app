import { describe, expect, it } from 'vitest';
import { computeStreak } from './streak.ts';

describe('computeStreak', () => {
  it('is 0 with no activity', () => {
    expect(computeStreak([], '2026-11-03')).toEqual({ current: 0, activeToday: false });
  });

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02', '2026-11-03'], '2026-11-03')).toEqual({ current: 3, activeToday: true });
  });

  it('keeps yesterday’s streak alive until today ends', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02'], '2026-11-03')).toEqual({ current: 2, activeToday: false });
  });

  it('resets after a fully missed day', () => {
    expect(computeStreak(['2026-10-30', '2026-10-31', '2026-11-01'], '2026-11-03').current).toBe(0);
  });

  it('only counts the latest run', () => {
    expect(computeStreak(['2026-10-28', '2026-10-29', '2026-11-02', '2026-11-03'], '2026-11-03').current).toBe(2);
  });

  it('crosses month and year boundaries', () => {
    expect(computeStreak(['2026-12-31', '2027-01-01'], '2027-01-01').current).toBe(2);
    expect(computeStreak(['2026-02-28', '2026-03-01'], '2026-03-01').current).toBe(2);
  });
});
