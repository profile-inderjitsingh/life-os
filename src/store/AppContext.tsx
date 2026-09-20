import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DataService } from '@/db/DataService';
import { todayKey } from '@/lib/date';
import type { DateKey, Settings, ThemeMode } from '@/types';

interface AppContextValue {
  /** The day every screen is currently showing — the Time Machine cursor. */
  date: DateKey;
  setDate: (date: DateKey) => void;
  goToToday: () => void;
  isTimeTravelling: boolean;
  settings: Settings | undefined;
  setTheme: (theme: ThemeMode) => void;
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.backgroundColor = dark ? '#000000' : '#F2F2F7';
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', dark ? '#000000' : '#F2F2F7');
  try {
    localStorage.setItem('life-os:theme', mode);
  } catch {
    /* Private mode — the DB still works, the pre-paint hint just won't persist. */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [date, setDateState] = useState<DateKey>(todayKey());
  const [ready, setReady] = useState(false);

  const settings = useLiveQuery(() => DataService.settings.get(), []);

  useEffect(() => {
    DataService.seedIfEmpty().finally(() => setReady(true));
  }, []);

  // Follow the system when the user has not overridden it.
  useEffect(() => {
    const mode = settings?.theme ?? 'system';
    applyTheme(mode);
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings?.theme]);

  // Roll the cursor forward if the app sits open past midnight.
  useEffect(() => {
    let known = todayKey();
    const id = window.setInterval(() => {
      const current = todayKey();
      if (current === known) return;
      // Only follow midnight if the user was sitting on "today", not mid-time-travel.
      setDateState((cursor) => (cursor === known ? current : cursor));
      known = current;
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const setDate = useCallback((next: DateKey) => setDateState(next), []);
  const goToToday = useCallback(() => setDateState(todayKey()), []);
  const setTheme = useCallback((theme: ThemeMode) => {
    applyTheme(theme);
    void DataService.settings.setTheme(theme);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      date,
      setDate,
      goToToday,
      isTimeTravelling: date !== todayKey(),
      settings,
      setTheme,
      ready,
    }),
    [date, setDate, goToToday, settings, setTheme, ready]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider.');
  return ctx;
}
