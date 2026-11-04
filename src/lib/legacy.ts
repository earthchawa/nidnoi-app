// One-time import of progress saved by the first version of the app (localStorage "nidnoi_progress_v2").
import type { NidnoiDB } from './db.ts';
import { addDays } from './date.ts';

const LEGACY_KEY = 'nidnoi_progress_v2';
const DONE_KEY = 'nidnoi_legacy_imported';

interface LegacyState {
  lastLessonDate?: string;
  learnedIds?: string[];
  streak?: number;
  lastStreakDate?: string;
}

export async function importLegacyProgress(db: NidnoiDB, storage: Storage) {
  let raw: string | null;
  try {
    if (storage.getItem(DONE_KEY)) return;
    raw = storage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (raw) {
    let old: LegacyState = {};
    try { old = JSON.parse(raw); } catch { /* unreadable: nothing to import */ }

    await db.transaction('rw', db.progress, db.activity, async () => {
      if (old.lastLessonDate) {
        for (const wordId of old.learnedIds ?? []) {
          if (!(await db.progress.get(wordId))) {
            await db.progress.put({ wordId, lessonDate: old.lastLessonDate, status: 'learning', saved: false });
          }
        }
      }
      // The old app only kept a count, so rebuild the streak as consecutive days ending on its last date.
      if (old.lastStreakDate && old.streak && old.streak > 0) {
        for (let i = 0; i < old.streak; i++) {
          const date = addDays(old.lastStreakDate, -i);
          if (!(await db.activity.get(date))) {
            await db.activity.put({ date, wordsLearned: 0, lessonCompleted: true });
          }
        }
      }
    });
  }
  try { storage.setItem(DONE_KEY, '1'); } catch { /* storage blocked: we'll retry next launch */ }
}
