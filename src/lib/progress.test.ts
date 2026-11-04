import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NidnoiDB } from './db.ts';
import { importLegacyProgress } from './legacy.ts';
import type { Lesson } from './lesson.ts';
import { getStreak, markLearned, toggleSaved } from './progress.ts';

const lesson = {
  date: '2026-11-02',
  theme: 'Everyday',
  context: 'Everyday',
  words: [1, 2, 3].map(n => ({ id: `20261102-${n}`, thai: `w${n}`, phonetic: 'a', tones: ['mid'], english: 'x', category: 'c', note: 'n', example: { thai: 't', phonetic: 'p', english: 'e' } }))
} as Lesson;

let db: NidnoiDB;
let n = 0;
beforeEach(() => { db = new NidnoiDB(`test-${n++}`); });
afterEach(async () => { await db.delete(); });

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(k: string) { return this.data.get(k) ?? null; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  removeItem(k: string) { this.data.delete(k); }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

describe('markLearned', () => {
  it('completes the day only when every word in the lesson is learned', async () => {
    await markLearned(db, lesson.words[0], lesson, '2026-11-03');
    await markLearned(db, lesson.words[1], lesson, '2026-11-03');
    expect((await db.activity.get('2026-11-03'))?.lessonCompleted).toBe(false);
    expect((await getStreak(db, '2026-11-03')).current).toBe(0);

    await markLearned(db, lesson.words[2], lesson, '2026-11-03');
    expect(await db.activity.get('2026-11-03')).toEqual({ date: '2026-11-03', wordsLearned: 3, lessonCompleted: true });
    expect(await getStreak(db, '2026-11-03')).toEqual({ current: 1, activeToday: true });
  });

  it('does not count the same word twice', async () => {
    await markLearned(db, lesson.words[0], lesson, '2026-11-03');
    await markLearned(db, lesson.words[0], lesson, '2026-11-03');
    expect((await db.activity.get('2026-11-03'))?.wordsLearned).toBe(1);
  });

  it('keeps a word saved before it was learned', async () => {
    await toggleSaved(db, lesson.words[0], lesson);
    await markLearned(db, lesson.words[0], lesson, '2026-11-03');
    expect(await db.progress.get(lesson.words[0].id)).toMatchObject({ status: 'learning', saved: true });
  });
});

describe('importLegacyProgress', () => {
  it('imports learned words and rebuilds the streak once', async () => {
    const storage = new MemoryStorage();
    storage.setItem('nidnoi_progress_v2', JSON.stringify({
      lastLessonDate: '2026-11-02', learnedIds: ['20261102-1', '20261102-2'], streak: 3, lastStreakDate: '2026-11-02'
    }));

    await importLegacyProgress(db, storage);
    expect(await db.progress.count()).toBe(2);
    expect(await getStreak(db, '2026-11-03')).toEqual({ current: 3, activeToday: false });

    await db.progress.clear();
    await importLegacyProgress(db, storage);
    expect(await db.progress.count()).toBe(0);
  });

  it('does nothing for new users', async () => {
    await importLegacyProgress(db, new MemoryStorage());
    expect(await db.activity.count()).toBe(0);
  });
});
