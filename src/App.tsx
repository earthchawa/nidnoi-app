import { useEffect, useState, type ReactNode } from 'react';
import { BooksIcon, SunIcon } from './components/Icons.tsx';
import { Noi } from './components/Noi.tsx';
import { useLessons } from './hooks/useLessons.ts';
import { localToday } from './lib/date.ts';
import { Library } from './screens/Library.tsx';
import { Today } from './screens/Today.tsx';

type Tab = 'today' | 'library';
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'today', label: 'Today', icon: <SunIcon /> },
  { id: 'library', label: 'Library', icon: <BooksIcon /> }
];
const tabFromHash = (): Tab => (location.hash === '#library' ? 'library' : 'today');

export function App() {
  const lessons = useLessons();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [today] = useState(localToday);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next: Tab) => {
    history.replaceState(null, '', `#${next}`);
    setTab(next);
    window.scrollTo(0, 0);
  };

  let content: ReactNode;
  if (lessons.status === 'loading') {
    content = <div className="flex flex-col items-center gap-2 pt-24 font-bold text-ink-2"><Noi mood="think" size={110} /><p>Loading your lesson…</p></div>;
  } else if (lessons.status === 'error' || lessons.lessons.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-3 pt-20 text-center font-bold text-ink-2">
        <Noi mood="oops" size={110} />
        <p>Couldn’t load lessons. Check your connection and try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  } else if (tab === 'library') {
    content = <Library lessons={lessons.lessons} today={today} />;
  } else {
    content = <Today lesson={lessons.lessons[0]} today={today} onOpenLibrary={() => go('library')} />;
  }

  return (
    <>
      <main className="mx-auto flex min-h-full max-w-[440px] flex-col gap-4 bg-bg pt-[18px] pb-[120px] pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] min-[520px]:border-x min-[520px]:border-line">
        {content}
      </main>
      <nav aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] pr-[max(16px,env(safe-area-inset-right,0px))]">
        <div className="mx-auto grid max-w-[408px] grid-cols-2 gap-1">
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 rounded-2xl pt-[7px] pb-[5px] text-xs font-extrabold text-ink-3 aria-[current=page]:bg-teal-soft aria-[current=page]:text-teal-dark [&_svg]:size-6">
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
