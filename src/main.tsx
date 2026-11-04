import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { db } from './lib/db.ts';
import { importLegacyProgress } from './lib/legacy.ts';
import './index.css';

// Bring over progress from the first version of the app before anything reads the database.
importLegacyProgress(db, localStorage)
  .catch(err => console.error('Legacy progress import failed', err))
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StrictMode>
    );
  });
