import { describe, expect, it } from 'vitest';
import { syllables, validateLesson, type Lesson } from './lesson.ts';

const word = (n: number, overrides = {}) => ({
  id: `20261103-${n}`,
  thai: ['ไปไหน', 'ตรงไป', 'เลี้ยวซ้าย', 'เลี้ยวขวา', 'จอดตรงนี้'][n - 1],
  phonetic: 'bpai nǎi',
  tones: ['mid', 'rising'],
  english: 'where to?',
  category: 'Directions',
  example: { thai: 'ไปไหนครับ', phonetic: 'bpai nǎi khráp', english: 'Where to?' },
  note: 'A tip',
  ...overrides
});
const lesson = (words = [1, 2, 3, 4, 5].map(n => word(n))): Lesson =>
  ({ date: '2026-11-03', theme: 'Getting a Grab', context: 'In a Grab', words }) as Lesson;

describe('syllables', () => {
  it('splits on spaces and hyphens', () => {
    expect(syllables('sà-wàt-dii khráp')).toEqual(['sà', 'wàt', 'dii', 'khráp']);
  });
});

describe('validateLesson', () => {
  it('accepts a well-formed lesson', () => {
    expect(validateLesson(lesson())).toEqual([]);
  });

  it('rejects the wrong number of words', () => {
    expect(validateLesson(lesson([word(1)]))).toContain('expected 5 words, got 1');
  });

  it('rejects tones that don’t match the syllables', () => {
    const errors = validateLesson(lesson([word(1, { tones: ['mid'] }), word(2), word(3), word(4), word(5)]));
    expect(errors.join()).toMatch(/1 entries but "bpai nǎi" has 2 syllables/);
  });

  it('rejects unknown tone names', () => {
    const errors = validateLesson(lesson([word(1, { tones: ['mid', 'up'] }), word(2), word(3), word(4), word(5)]));
    expect(errors.join()).toMatch(/tones must only contain/);
  });

  it('rejects words taught before', () => {
    expect(validateLesson(lesson(), ['ตรงไป']).join()).toMatch(/"ตรงไป" was already taught/);
  });

  it('rejects missing example fields', () => {
    const errors = validateLesson(lesson([word(1, { example: { thai: 'x' } }), word(2), word(3), word(4), word(5)]));
    expect(errors.join()).toMatch(/example needs/);
  });
});
