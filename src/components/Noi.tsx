// Noi, the elephant mascot. Placeholder art until a character designer draws the final version.

export type NoiMood = 'hi' | 'happy' | 'cheer' | 'oops' | 'sleepy' | 'think';

const TRUNK: Partial<Record<NoiMood, string>> = {
  cheer: 'M60 70C60 86 79 90 86 74',
  hi: 'M60 70C60 88 70 95 80 88',
  oops: 'M60 70C60 90 54 100 44 97'
};
const LABEL: Record<NoiMood, string> = {
  hi: 'waving hello', happy: 'smiling', cheer: 'cheering', oops: 'looking worried', sleepy: 'asleep', think: 'thinking'
};

const eyeLine = { fill: 'none', stroke: 'var(--ele-ink)', strokeWidth: 3.5, strokeLinecap: 'round' } as const;

function Eyes({ mood }: { mood: NoiMood }) {
  if (mood === 'happy' || mood === 'cheer') return <path {...eyeLine} d="M42 56q6-7 12 0M66 56q6-7 12 0" />;
  if (mood === 'sleepy') return <path {...eyeLine} d="M42 55q6 5 12 0M66 55q6 5 12 0" />;
  const dx = mood === 'think' ? 2 : 0;
  const dy = mood === 'think' ? -3 : 0;
  return (
    <>
      <circle cx={48 + dx} cy={54 + dy} r={4.8} fill="var(--ele-ink)" />
      <circle cx={72 + dx} cy={54 + dy} r={4.8} fill="var(--ele-ink)" />
      <circle cx={49.7 + dx} cy={52.3 + dy} r={1.6} fill="#fff" />
      <circle cx={73.7 + dx} cy={52.3 + dy} r={1.6} fill="#fff" />
      {mood === 'oops' && <path {...eyeLine} strokeWidth={2.6} d="M42 44l9 2.5M78 44l-9 2.5" />}
    </>
  );
}

const Spark = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-6 1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6z" fill="var(--amber)" />
);

function Extras({ mood }: { mood: NoiMood }) {
  switch (mood) {
    case 'cheer':
      return <><Spark x={10} y={20} s={1.3} /><Spark x={108} y={24} s={1} /><Spark x={110} y={94} s={0.8} /><Spark x={8} y={92} s={0.7} /></>;
    case 'oops':
      return <path d="M99 30q6 8 0 12q-6-4 0-12z" fill="var(--drop)" />;
    case 'sleepy':
      return (
        <g fill="var(--ink-3)" fontWeight={900} fontFamily="Nunito, sans-serif">
          <text x={94} y={30} fontSize={15}>z</text><text x={104} y={17} fontSize={11}>z</text>
        </g>
      );
    case 'think':
      return <g fill="var(--ink-3)"><circle cx={95} cy={30} r={2.6} /><circle cx={102} cy={21} r={3.6} /><circle cx={111} cy={10} r={4.6} /></g>;
    default:
      return null;
  }
}

export function Noi({ mood = 'hi', size = 96 }: { mood?: NoiMood; size?: number }) {
  return (
    <svg className={`noi-${mood} block overflow-visible`} viewBox="0 0 120 112" width={size} height={Math.round((size * 112) / 120)}
      role="img" aria-label={`Noi the elephant, ${LABEL[mood]}`}>
      <ellipse cx={25} cy={58} rx={22} ry={27} fill="var(--ele-2)" />
      <ellipse cx={95} cy={58} rx={22} ry={27} fill="var(--ele-2)" />
      <ellipse cx={27} cy={59} rx={13} ry={17} fill="var(--ear)" />
      <ellipse cx={93} cy={59} rx={13} ry={17} fill="var(--ear)" />
      <circle cx={60} cy={54} r={33} fill="var(--ele)" />
      <path d={TRUNK[mood] ?? 'M60 70C59 88 64 99 76 98'} fill="none" stroke="var(--ele)" strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={40} cy={67} rx={6.5} ry={4} fill="var(--ear)" />
      <ellipse cx={80} cy={67} rx={6.5} ry={4} fill="var(--ear)" />
      <Eyes mood={mood} />
      <path d="M60 22c0-5 1-9 4-12" stroke="var(--leaf)" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M63 11c5-6 12-6 16-3-4 6-11 7-16 3z" fill="var(--leaf)" />
      <Extras mood={mood} />
    </svg>
  );
}

/** Noi in a rounded tile, used in headers and tips. */
export const NoiAvatar = ({ mood = 'hi', size = 52 }: { mood?: NoiMood; size?: number }) => (
  <div className="grid shrink-0 place-items-center overflow-hidden rounded-[18px] bg-surface-2" style={{ width: size, height: size }}>
    <Noi mood={mood} size={Math.round(size * 0.88)} />
  </div>
);
