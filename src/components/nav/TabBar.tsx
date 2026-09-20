import { motion } from 'framer-motion';
import { BookOpen, CircleCheckBig, LayoutGrid, Repeat2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import type { Route } from '@/lib/router';

const TABS: Array<{ route: Route; label: string; Icon: typeof LayoutGrid }> = [
  { route: 'dashboard', label: 'Today', Icon: LayoutGrid },
  { route: 'habits', label: 'Habits', Icon: Repeat2 },
  { route: 'tasks', label: 'Tasks', Icon: CircleCheckBig },
  { route: 'journal', label: 'Journal', Icon: BookOpen },
  { route: 'settings', label: 'Settings', Icon: Settings2 },
];

export function TabBar({ route, onNavigate }: { route: Route; onNavigate: (route: Route) => void }) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.07] dark:border-white/[0.08]',
        'bg-white/70 backdrop-blur-xl dark:bg-black/60',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ route: value, label, Icon }) => {
          const active = route === value;
          return (
            <li key={value} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!active) haptic('light');
                  onNavigate(value);
                }}
                aria-current={active ? 'page' : undefined}
                className="relative flex w-full flex-col items-center gap-1 pb-1.5 pt-2"
              >
                <motion.span
                  animate={{ scale: active ? 1 : 0.94 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'grid place-items-center',
                    active ? 'text-ios-blue' : 'text-black/40 dark:text-white/40'
                  )}
                >
                  <Icon size={23} strokeWidth={active ? 2.4 : 1.9} />
                </motion.span>
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-tight',
                    active ? 'text-ios-blue' : 'text-black/40 dark:text-white/40'
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
