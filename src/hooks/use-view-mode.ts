import { useState } from 'react';

type ViewMode = 'card' | 'table';

export function useViewMode(key: string, defaultMode: ViewMode = 'card'): [ViewMode, (mode: ViewMode) => void] {
  const storageKey = `caps-view-mode-${key}`;
  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(storageKey) as ViewMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try { localStorage.setItem(storageKey, newMode); } catch {}
  };

  return [mode, setMode];
}
