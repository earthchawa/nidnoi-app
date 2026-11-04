import type { Lesson, LessonIndex } from './lesson.ts';

const base = import.meta.env.BASE_URL;

async function getJson<T>(path: string): Promise<T> {
  // no-cache: always revalidate so a new daily lesson shows up; the service worker covers offline.
  const res = await fetch(`${base}${path}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
  return res.json() as Promise<T>;
}

export const fetchIndex = () => getJson<LessonIndex>('data/index.json');
export const fetchLesson = (date: string) => getJson<Lesson>(`data/lessons/${date}.json`);
