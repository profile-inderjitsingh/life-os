import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Habit } from '@/types';

/**
 * Horizontal rail of streaks, hottest first. A streak only lights up once it
 * has two days behind it — one day is not a streak, and pretending otherwise
 * cheapens the number.
 */
export function StreakRail({ streaks }: { streaks: Array<{ habit: Habit; streak: number }> }) {
  if (streaks.length === 0) {
    return (
      <p className="py-4 text-center text-[15px] text-black/40 dark:text-white/40">
        Add a habit to start a streak.
      </p>
    );
  }

  return (
    <div className="ios-scroll -mx-4 flex gap-2.5 overflow-x-auto px-4">
      {streaks.map(({ habit, streak }) => {
        const alive = streak > 0;
        return (
          <div
            key={habit.id}
            className={cn(
              'flex w-[104px] shrink-0 flex-col gap-1 rounded-2xl p-3',
              alive ? 'bg-black/[0.04] dark:bg-white/[0.07]' : 'bg-black/[0.02] dark:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] leading-none">{habit.emoji}</span>
              <Flame
                size={16}
                className={cn(
                  streak >= 7
                    ? 'text-ios-orange'
                    : alive
                      ? 'text-ios-orange/70'
                      : 'text-black/20 dark:text-white/20'
                )}
                fill={streak >= 7 ? 'currentColor' : 'none'}
              />
            </div>
            <p className="text-[26px] font-bold leading-none tabular-nums">
              {streak}
              <span className="ml-1 text-[12px] font-semibold text-black/35 dark:text-white/35">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="truncate text-[12px] text-black/50 dark:text-white/50">{habit.name}</p>
          </div>
        );
      })}
    </div>
  );
}
