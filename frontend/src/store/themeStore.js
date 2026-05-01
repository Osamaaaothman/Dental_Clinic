import { create } from 'zustand';

const STORAGE_KEY = 'clinic-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'clinic-light';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'clinic-dark' || stored === 'clinic-light') {
    return stored;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return prefersDark ? 'clinic-dark' : 'clinic-light';
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (theme !== 'clinic-dark' && theme !== 'clinic-light') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'clinic-dark' ? 'clinic-light' : 'clinic-dark';
    window.localStorage.setItem(STORAGE_KEY, next);
    set({ theme: next });
  },
}));
