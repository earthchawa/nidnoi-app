import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db.ts';
import { addDays, formatShort } from '../lib/date.ts';
import type { Lesson } from '../lib/lesson.ts';
import { getStreak, markLearned, toggleSaved } from '../lib/progress.ts';
import { BookmarkIcon, ChevronLeftIcon, FlameIcon, SpeakerIcon } from '../components/Icons.tsx';
import { Noi, NoiAvatar } from '../components/Noi.tsx';
import { useSpeak, useToast } from '../components/Toast.tsx';
import { ExampleBlock, ToneChips } from '../components/WordParts.tsx';

interface Props {
  lesson: Lesson;
  today: string;
  onOpenLibrary: () => void;
}

const StreakChip = ({ count, label = '' }: { count: number; label?: string }) => (
  <div title="Day streak"
    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-soft py-1.5 pr-3 pl-2 text-[15px] font-black text-amber-ink tabular-nums [&_svg]:size-[18px] [&_svg]:text-amber">
    <FlameIcon />{count}{label}
  </div>
);

export function Today({ lesson, today, onOpenLibrary }: Props) {
  const speak = useSpeak();
  const toast = useToast();
  const progress = useLiveQuery(() => db.progress.where('lessonDate').equals(lesson.date).toArray(), [lesson.date]);
  const streak = useLiveQuery(() => getStreak(db, today), [today]);
  const [index, setIndex] = useState<number | null>(null);
  const [browsing, setBrowsing] = useState(false);

  if (!progress || !streak) return null;

  const learned = new Set(progress.filter(p => p.status !== 'new').map(p => p.wordId));
  const saved = new Set(progress.filter(p => p.saved).map(p => p.wordId));
  const words = lesson.words;
  const done = words.every(w => learned.has(w.id));
  const firstUnlearned = Math.max(0, words.findIndex(w => !learned.has(w.id)));
  const idx = index ?? firstUnlearned;
  const word = words[idx];
  const isLatestToday = lesson.date === today;

  const header = (
    <header className="flex items-center gap-3">
      <NoiAvatar mood="hi" />
      <div className="min-w-0">
        <p className="eyebrow">{isLatestToday ? formatShort(today) : `Latest lesson · ${formatShort(lesson.date)}`}</p>
        <h1 className="title">{lesson.theme}</h1>
      </div>
      <div className="ml-auto"><StreakChip count={streak.current} /></div>
    </header>
  );

  if (done && !browsing) {
    return (
      <>
        {header}
        <section className="flex flex-col items-center gap-2.5 pt-3 text-center">
          <Noi mood="cheer" size={150} />
          <h1 className="title">Lesson done</h1>
          <p className="max-w-[34ch] font-bold text-ink-2">
            You learned {words.length} words for <b className="text-ink">{lesson.theme}</b>. They’re saved in your library.
          </p>
          <div className="mt-1"><StreakChip count={streak.current} label=" day streak" /></div>
        </section>
        <section className="card">
          <button type="button" className="btn btn-primary w-full" onClick={onOpenLibrary}>Browse library</button>
          <button type="button" className="btn btn-ghost w-full" onClick={() => { setBrowsing(true); setIndex(0); }}>
            Go over these words again
          </button>
        </section>
        <p className="text-center text-[13px] font-bold text-ink-3">
          {isLatestToday
            ? `Next lesson arrives ${formatShort(addDays(today, 1))} at 07:00`
            : 'Today’s lesson isn’t out yet. Check back soon.'}
        </p>
      </>
    );
  }

  const last = idx === words.length - 1;
  const label = browsing ? (last ? 'Finish' : 'Next') : learned.has(word.id) ? 'Next word' : 'Got it';

  const next = async () => {
    window.scrollTo(0, 0);
    if (browsing) {
      if (last) { setBrowsing(false); setIndex(null); } else setIndex(idx + 1);
      return;
    }
    await markLearned(db, word, lesson, today);
    const nowLearned = new Set(learned).add(word.id);
    const nextIdx = words.findIndex((w, i) => i > idx && !nowLearned.has(w.id));
    const wrapIdx = words.findIndex(w => !nowLearned.has(w.id));
    setIndex(nextIdx >= 0 ? nextIdx : wrapIdx >= 0 ? wrapIdx : null);
  };

  const onSave = async () => {
    await toggleSaved(db, word, lesson);
    toast(saved.has(word.id) ? 'Removed from saved' : 'Saved to your library');
  };

  return (
    <>
      {header}
      <div className="grid grid-cols-5 gap-1.5">
        {words.map((w, i) => (
          <button key={w.id} type="button" aria-label={`Word ${i + 1}`} onClick={() => setIndex(i)}
            className={`h-2 rounded-full ${learned.has(w.id) ? 'bg-teal' : i === idx ? 'bg-teal-soft shadow-[inset_0_0_0_2px_var(--teal)]' : 'bg-line'}`} />
        ))}
      </div>

      <article key={word.id} className="card" aria-label={`Word ${idx + 1} of ${words.length}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="chip">{word.category}</span>
          <span className="chip">{idx + 1} of {words.length}</span>
        </div>
        <p lang="th" className="mt-1.5 text-center text-[clamp(42px,13vw,54px)] leading-[1.4] font-semibold">{word.thai}</p>
        <p className="text-center text-[19px] font-extrabold text-teal-dark">{word.phonetic}</p>
        <ToneChips word={word} />
        <p className="text-center text-[21px] font-black">{word.english}</p>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button type="button" className="btn btn-soft" onClick={() => speak(word.thai)}><SpeakerIcon />Listen</button>
          <button type="button" className="btn btn-ghost" onClick={() => speak(word.thai, true)}>Slow</button>
          <button type="button" className="btn btn-ghost w-[52px] px-0" aria-pressed={saved.has(word.id)} aria-label="Save word" onClick={onSave}>
            <BookmarkIcon />
          </button>
        </div>
        <ExampleBlock word={word} lesson={lesson} />
      </article>

      <div className="flex items-end gap-2.5">
        <NoiAvatar mood="happy" size={46} />
        <p className="min-w-0 rounded-[18px_18px_18px_6px] border border-line bg-surface px-3.5 py-3 text-sm leading-normal font-bold text-ink-2">
          <b className="font-black text-ink">Noi’s tip</b><br />{word.note}
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2.5">
        <button type="button" className="btn btn-ghost w-14 px-0" aria-label="Previous word"
          onClick={() => setIndex((idx + words.length - 1) % words.length)}>
          <ChevronLeftIcon />
        </button>
        <button type="button" className="btn btn-primary" onClick={next}>{label}</button>
      </div>
    </>
  );
}
