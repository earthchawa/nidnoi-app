import { useEffect, useState } from 'react';
import { fetchIndex, fetchLesson } from '../lib/data.ts';
import type { Lesson } from '../lib/lesson.ts';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lessons: Lesson[] };

/** Loads every published lesson, newest first. */
export function useLessons(): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const index = await fetchIndex();
        const lessons = await Promise.all(index.lessons.map(l => fetchLesson(l.date)));
        if (!cancelled) setState({ status: 'ready', lessons });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
