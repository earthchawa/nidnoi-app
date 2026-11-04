import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WordStatus } from '../lib/db.ts';
import { formatRelative } from '../lib/date.ts';
import type { Lesson, Word } from '../lib/lesson.ts';
import { toggleSaved } from '../lib/progress.ts';
import { BookmarkIcon, SearchIcon, SpeakerIcon } from '../components/Icons.tsx';
import { Noi } from '../components/Noi.tsx';
import { useSpeak } from '../components/Toast.tsx';
import { ExampleBlock, ToneChips } from '../components/WordParts.tsx';

type Filter = 'all' | 'saved' | 'learned';

const STATUS_CLASS: Record<WordStatus, string> = {
  new: 'bg-surface-2 text-ink-2',
  learning: 'bg-blue-soft text-blue-ink',
  weak: 'bg-amber-soft text-amber-ink',
  known: 'bg-teal-soft text-teal-dark'
};

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Library({ lessons, today }: { lessons: Lesson[]; today: string }) {
  const speak = useSpeak();
  const rows = useLiveQuery(() => db.progress.toArray(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);

  if (!rows) return null;
  const progress = new Map(rows.map(r => [r.wordId, r]));
  const statusOf = (w: Word): WordStatus => progress.get(w.id)?.status ?? 'new';
  const isSaved = (w: Word) => progress.get(w.id)?.saved ?? false;
  const learnedCount = rows.filter(r => r.status !== 'new').length;

  const q = query.trim();
  const fq = fold(q);
  const keep = (w: Word) => {
    if (filter === 'saved' && !isSaved(w)) return false;
    if (filter === 'learned' && statusOf(w) === 'new') return false;
    return !q || w.thai.includes(q) || fold(w.phonetic).includes(fq) || fold(w.english).includes(fq);
  };
  const groups = lessons
    .map(lesson => ({ lesson, words: lesson.words.filter(keep) }))
    .filter(g => g.words.length);

  const emptyMessage = q ? `No words match “${q}”.`
    : filter === 'saved' ? 'Tap the bookmark on any word to keep it here.'
    : filter === 'learned' ? 'Words you mark as learned show up here.'
    : 'Lessons will appear here.';

  const chip = (value: Filter, label: string) => (
    <button type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setOpen(null); }}
      className="rounded-full bg-surface px-3.5 py-2 text-sm font-extrabold text-ink-2 shadow-[inset_0_0_0_1.5px_var(--line)] aria-pressed:bg-ink aria-pressed:text-bg aria-pressed:shadow-none">
      {label}
    </button>
  );

  return (
    <>
      <header>
        <p className="eyebrow">{learnedCount} words learned across {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</p>
        <h1 className="title">Library</h1>
      </header>

      <label className="flex items-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface px-3.5 text-ink-3 focus-within:border-teal [&_svg]:size-5 [&_svg]:shrink-0">
        <SearchIcon />
        <input id="library-search" type="search" value={query} autoComplete="off" placeholder="Search Thai, sounds or English"
          onChange={e => { setQuery(e.target.value); setOpen(null); }}
          className="min-w-0 flex-1 bg-transparent py-3 text-base font-bold text-ink outline-none placeholder:text-ink-3" />
      </label>

      <div className="flex flex-wrap gap-2">{chip('all', 'All')}{chip('saved', 'Saved')}{chip('learned', 'Learned')}</div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-2 py-5 text-center font-bold text-ink-2">
          <Noi mood="think" size={90} /><p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {groups.map(({ lesson, words }) => (
            <section key={lesson.date} className="flex flex-col gap-2">
              <h2 className="flex justify-between gap-2 text-[13px] font-black text-ink-2">
                <span>{formatRelative(lesson.date, today)} · {lesson.theme}</span>
                <span className="text-ink-3">{words.length} {words.length === 1 ? 'word' : 'words'}</span>
              </h2>
              <div className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
                {words.map(word => {
                  const status = statusOf(word);
                  const expanded = open === word.id;
                  return (
                    <div key={word.id}>
                      <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : word.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                        <div className="min-w-0 flex-1">
                          <p lang="th" className="text-xl leading-snug font-semibold">{word.thai}</p>
                          <p className="truncate text-sm font-bold text-ink-2">
                            <span className="text-teal-dark">{word.phonetic}</span> · {word.english}
                          </p>
                        </div>
                        {isSaved(word) && <span className="size-4 shrink-0 text-teal [&_svg]:size-4 [&_svg]:fill-current" aria-label="Saved"><BookmarkIcon /></span>}
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${STATUS_CLASS[status]}`}>{status}</span>
                      </button>
                      {expanded && (
                        <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
                          <ToneChips word={word} align="start" />
                          <ExampleBlock word={word} lesson={lesson} />
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <button type="button" className="btn btn-soft" onClick={() => speak(word.thai)}><SpeakerIcon />Listen</button>
                            <button type="button" className="btn btn-ghost w-[52px] px-0" aria-pressed={isSaved(word)} aria-label="Save word"
                              onClick={() => toggleSaved(db, word, lesson)}>
                              <BookmarkIcon />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
