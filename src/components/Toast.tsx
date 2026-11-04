import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { speakThai } from '../lib/speech.ts';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite"
        className={`pointer-events-none fixed left-1/2 z-30 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[14px] bg-ink px-4 py-2.5 text-center text-sm font-extrabold text-bg transition-all duration-200
          bottom-[calc(92px+env(safe-area-inset-bottom,0px))] ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2.5 opacity-0'}`}>
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Speaks Thai and tells the learner once if their device has no Thai voice. */
export function useSpeak() {
  const toast = useToast();
  const warned = useRef(false);
  return useCallback((text: string, slow = false) => {
    const result = speakThai(text, slow);
    if (result === 'unsupported') toast('Audio isn’t available in this browser');
    else if (result === 'no-thai-voice' && !warned.current) {
      warned.current = true;
      toast('No Thai voice on this device, so audio may sound off');
    }
  }, [toast]);
}
