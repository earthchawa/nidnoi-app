// Lesson data shape and validation. Shared by the app, the daily generator script and tests,
// so it must stay free of browser- or Node-only APIs.

export const TONES = ['mid', 'low', 'falling', 'high', 'rising'] as const;
export type Tone = (typeof TONES)[number];

export interface Example {
  thai: string;
  phonetic: string;
  english: string;
}

export interface Word {
  id: string;
  thai: string;
  phonetic: string;
  /** One tone per syllable of `phonetic` (syllables split on spaces and hyphens). */
  tones: Tone[];
  english: string;
  category: string;
  example: Example;
  note: string;
}

export interface Lesson {
  date: string;
  theme: string;
  /** Short situation label shown above example sentences, e.g. "In a Grab". */
  context: string;
  words: Word[];
}

export interface LessonSummary {
  date: string;
  theme: string;
  wordCount: number;
}

export interface LessonIndex {
  /** Newest first. */
  lessons: LessonSummary[];
}

export const WORDS_PER_LESSON = 5;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const syllables = (phonetic: string): string[] => phonetic.trim().split(/[\s-]+/).filter(Boolean);

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Returns a list of problems; an empty list means the lesson is valid. */
export function validateLesson(data: unknown, usedThai: Iterable<string> = []): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') return ['lesson is not an object'];
  const l = data as Partial<Lesson>;

  if (!isText(l.date) || !DATE_RE.test(l.date)) errors.push('date must be YYYY-MM-DD');
  if (!isText(l.theme)) errors.push('theme is missing');
  if (!isText(l.context)) errors.push('context is missing');
  if (!Array.isArray(l.words)) return [...errors, 'words must be an array'];
  if (l.words.length !== WORDS_PER_LESSON) errors.push(`expected ${WORDS_PER_LESSON} words, got ${l.words.length}`);

  const used = new Set(usedThai);
  const seenIds = new Set<string>();
  const seenThai = new Set<string>();
  l.words.forEach((w, i) => {
    const at = `words[${i}]`;
    if (!w || typeof w !== 'object') { errors.push(`${at} is not an object`); return; }
    for (const key of ['id', 'thai', 'phonetic', 'english', 'category', 'note'] as const) {
      if (!isText(w[key])) errors.push(`${at}.${key} is missing`);
    }
    if (!w.example || !isText(w.example.thai) || !isText(w.example.phonetic) || !isText(w.example.english)) {
      errors.push(`${at}.example needs thai, phonetic and english`);
    }
    if (!Array.isArray(w.tones) || !w.tones.every(t => (TONES as readonly string[]).includes(t))) {
      errors.push(`${at}.tones must only contain ${TONES.join(', ')}`);
    } else if (isText(w.phonetic) && w.tones.length !== syllables(w.phonetic).length) {
      errors.push(`${at}.tones has ${w.tones.length} entries but "${w.phonetic}" has ${syllables(w.phonetic).length} syllables`);
    }
    if (isText(w.id)) {
      if (seenIds.has(w.id)) errors.push(`${at}.id "${w.id}" is duplicated`);
      seenIds.add(w.id);
    }
    if (isText(w.thai)) {
      if (seenThai.has(w.thai)) errors.push(`${at}.thai "${w.thai}" appears twice in this lesson`);
      if (used.has(w.thai)) errors.push(`${at}.thai "${w.thai}" was already taught in an earlier lesson`);
      seenThai.add(w.thai);
    }
  });
  return errors;
}
