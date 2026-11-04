import { syllables, type Lesson, type Tone, type Word } from '../lib/lesson.ts';
import { SpeakerIcon } from './Icons.tsx';
import { useSpeak } from './Toast.tsx';

const CONTOUR: Record<Tone, string> = {
  mid: 'M2 6h16',
  low: 'M2 8.5 18 10',
  falling: 'M2 5Q8 0 18 11',
  high: 'M2 4Q12 3.5 18 1',
  rising: 'M2 7Q8 12 18 1'
};
const TONE_CLASS: Record<Tone, string> = {
  mid: 'text-tone-mid bg-tone-mid/15',
  low: 'text-tone-low bg-tone-low/15',
  falling: 'text-tone-falling bg-tone-falling/15',
  high: 'text-tone-high bg-tone-high/15',
  rising: 'text-tone-rising bg-tone-rising/15'
};

/** One chip per syllable showing its tone as a pitch contour. */
export function ToneChips({ word, align = 'center' }: { word: Word; align?: 'center' | 'start' }) {
  const parts = syllables(word.phonetic);
  return (
    <div className={`flex flex-wrap gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      {word.tones.map((tone, i) => (
        <span key={i} title={`${tone} tone`}
          className={`inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-[13px] font-extrabold ${TONE_CLASS[tone]}`}>
          <svg viewBox="0 0 20 12" className="h-3 w-5" aria-hidden="true">
            <path d={CONTOUR[tone]} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
          </svg>
          {parts[i]}
          <span className="sr-only">, {tone} tone</span>
        </span>
      ))}
    </div>
  );
}

export function ExampleBlock({ word, lesson }: { word: Word; lesson: Lesson }) {
  const speak = useSpeak();
  return (
    <div className="flex items-start gap-2.5 rounded-[18px] bg-surface-2 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black tracking-[.07em] text-ink-3 uppercase">{lesson.context}</p>
        <p lang="th" className="mt-0.5 text-lg font-medium">{word.example.thai}</p>
        <p className="text-sm font-bold text-teal-dark">{word.example.phonetic}</p>
        <p className="mt-0.5 text-sm text-ink-2">{word.example.english}</p>
      </div>
      <button type="button" onClick={() => speak(word.example.thai)} aria-label="Play example sentence"
        className="grid size-[42px] shrink-0 place-items-center rounded-[13px] bg-surface text-teal-dark [&_svg]:size-5">
        <SpeakerIcon />
      </button>
    </div>
  );
}
