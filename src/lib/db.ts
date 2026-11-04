import Dexie, { type EntityTable } from 'dexie';

export type WordStatus = 'new' | 'learning' | 'weak' | 'known';

/** What the learner has done with one word. Words never touched have no row. */
export interface WordProgress {
  wordId: string;
  lessonDate: string;
  status: WordStatus;
  saved: boolean;
  /** Epoch ms when first marked as learned. */
  learnedAt?: number;
}

/** One row per local calendar day the learner studied. */
export interface DayActivity {
  date: string;
  wordsLearned: number;
  lessonCompleted: boolean;
}

export class NidnoiDB extends Dexie {
  progress!: EntityTable<WordProgress, 'wordId'>;
  activity!: EntityTable<DayActivity, 'date'>;

  constructor(name = 'nidnoi') {
    super(name);
    this.version(1).stores({
      progress: 'wordId, lessonDate, status',
      activity: 'date'
    });
  }
}

export const db = new NidnoiDB();
