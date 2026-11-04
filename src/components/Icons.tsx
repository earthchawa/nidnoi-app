import type { ReactNode } from 'react';

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const SunIcon = () => (
  <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></Svg>
);
export const BooksIcon = () => <Svg><path d="M4.5 4h4v16h-4zM10.5 4h4v16h-4zM16.6 5.2l3.6 1-3.9 14.3-3.6-1" /></Svg>;
export const SpeakerIcon = () => (
  <Svg><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.4a8 8 0 0 1 0 11.2" /></Svg>
);
export const BookmarkIcon = () => <Svg><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.2L6 21V4.5a1 1 0 0 1 1-1z" /></Svg>;
export const ChevronLeftIcon = () => <Svg><path d="M15 5l-7 7 7 7" /></Svg>;
export const SearchIcon = () => <Svg><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Svg>;
export const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5c.6 3.6 5.6 5.6 5.6 11a5.6 5.6 0 0 1-11.2 0c0-2.6 1.4-4.5 2.7-5.6.1 1.8.9 3 2 3.4-.4-3.2-.2-6 .9-8.8z" />
  </svg>
);
