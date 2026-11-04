// Reads and writes the lesson files under public/data, which Vite serves as-is.
import fs from 'node:fs';
import path from 'node:path';
import type { Lesson, LessonIndex } from '../src/lib/lesson.ts';

export const DATA_DIR = path.resolve(import.meta.dirname, '..', 'public', 'data');
export const LESSONS_DIR = path.join(DATA_DIR, 'lessons');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');

export const lessonPath = (date: string) => path.join(LESSONS_DIR, `${date}.json`);

export function readAllLessons(): Lesson[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs.readdirSync(LESSONS_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, f), 'utf-8')) as Lesson);
}

export function readIndex(): LessonIndex {
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) as LessonIndex;
}

export function buildIndex(lessons: Lesson[]): LessonIndex {
  return {
    lessons: [...lessons]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(l => ({ date: l.date, theme: l.theme, wordCount: l.words.length }))
  };
}

const writeJson = (file: string, data: unknown) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');

export function saveLesson(lesson: Lesson) {
  fs.mkdirSync(LESSONS_DIR, { recursive: true });
  writeJson(lessonPath(lesson.date), lesson);
  writeJson(INDEX_PATH, buildIndex(readAllLessons()));
}
