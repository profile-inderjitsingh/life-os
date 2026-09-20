import { AnimatePresence, motion } from 'framer-motion';
import { DateStrip } from '@/components/nav/DateStrip';
import { TabBar } from '@/components/nav/TabBar';
import { useRouter, type Route } from '@/lib/router';
import { Dashboard } from '@/screens/Dashboard';
import { Habits } from '@/screens/Habits';
import { Journal } from '@/screens/Journal';
import { Settings } from '@/screens/Settings';
import { Tasks } from '@/screens/Tasks';
import { AppProvider, useApp } from '@/store/AppContext';

const TITLES: Record<Route, string> = {
  dashboard: 'Today',
  habits: 'Habits',
  tasks: 'Tasks',
  journal: 'Journal',
  settings: 'Settings',
};

function Shell() {
  const { route, navigate } = useRouter();
  const { ready } = useApp();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
      {route === 'settings' ? (
        <header className="sticky top-0 z-20 bg-[#F2F2F7]/80 px-4 backdrop-blur-xl dark:bg-black/70">
          <div className="pt-[env(safe-area-inset-top)]">
            <h1 className="py-2 text-[32px] font-bold leading-tight tracking-tight">Settings</h1>
          </div>
        </header>
      ) : (
        <DateStrip title={TITLES[route]} />
      )}

      <main className="ios-scroll flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] pt-1">
        {!ready ? (
          <div className="grid h-[50vh] place-items-center text-[15px] text-black/35 dark:text-white/35">
            Opening your data…
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            >
              {route === 'dashboard' && <Dashboard onNavigate={navigate} />}
              {route === 'habits' && <Habits />}
              {route === 'tasks' && <Tasks />}
              {route === 'journal' && <Journal />}
              {route === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <TabBar route={route} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
