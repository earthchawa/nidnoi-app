import type { NidnoiDB, WordProgress } from './db.ts';
import type { Lesson, Word } from './lesson.ts';
import { computeStreak } from './streak.ts';

export async function markLearned(db: NidnoiDB, word: Word, lesson: Lesson, today: string) {
  await db.transaction('rw', db.progress, db.activity, async () => {
    const existing = await db.progress.get(word.id);
    if (existing && existing.status !== 'new') return;
    await db.progress.put({
      wordId: word.id,
      lessonDate: lesson.date,
      status: 'learning',
      saved: existing?.saved ?? false,
      learnedAt: Date.now()
    });

    const learnedIds = new Set(
      (await db.progress.where('lessonDate').equals(lesson.date).toArray())
        .filter(p => p.status !== 'new')
        .map(p => p.wordId)
    );
    const lessonCompleted = lesson.words.every(w => learnedIds.has(w.id));
    const day = await db.activity.get(today);
    await db.activity.put({
      date: today,
      wordsLearned: (day?.wordsLearned ?? 0) + 1,
      lessonCompleted: (day?.lessonCompleted ?? false) || lessonCompleted
    });
  });
}

export async function toggleSaved(db: NidnoiDB, word: Word, lesson: Lesson) {
  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(word.id);
    const next: WordProgress = existing
      ? { ...existing, saved: !existing.saved }
      : { wordId: word.id, lessonDate: lesson.date, status: 'new', saved: true };
    await db.progress.put(next);
  });
}

/** A day counts toward the streak once a full lesson is finished on it. */
export async function getStreak(db: NidnoiDB, today: string) {
  const days = await db.activity.filter(d => d.lessonCompleted).primaryKeys();
  return computeStreak(days, today);
}
