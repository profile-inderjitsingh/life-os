import { useState } from 'react';
import { cn } from '@/lib/cn';
import { humanDate, toKey } from '@/lib/date';
import type { DayPunctuality, DateKey } from '@/types';

/**
 * A month of days as a contribution grid. Colour answers one question at a
 * glance: did the things I scheduled actually happen when I said they would?
 */
export function PunctualityHeatmap({
  days,
  data,
  onSelectDay,
}: {
  days: Date[];
  data: Map<DateKey, DayPunctuality>;
  onSelectDay?: (key: DateKey) => void;
}) {
  const [active, setActive] = useState<DateKey | null>(null);
  const leadingBlanks = days.length ? days[0].getDay() : 0;
  const today = toKey(new Date());

  const activeStats = active ? data.get(active) : undefined;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-black/35 dark:text-white/35">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const key = toKey(d);
          const stats = data.get(key);
          const future = key > today;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActive(key === active ? null : key);
                onSelectDay?.(key);
              }}
              aria-label={`${humanDate(key)}: ${describe(stats)}`}
              className={cn(
                'relative aspect-square rounded-[7px] transition-transform active:scale-90',
                cellClass(stats, future),
                active === key && 'ring-2 ring-ios-blue ring-offset-1 ring-offset-white dark:ring-offset-[#1C1C1E]'
              )}
            >
              {key === today && (
                <span className="absolute inset-0 rounded-[7px] ring-[1.5px] ring-inset ring-black/40 dark:ring-white/60" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-black/45 dark:text-white/45">
          <Key className="bg-[#30D158]" label="On time" />
          <Key className="bg-[#FF9F0A]" label="Late" />
          <Key className="bg-[#FF453A]" label="Missed" />
        </div>
      </div>

      <p className="mt-2 min-h-[18px] text-[13px] text-black/50 dark:text-white/50">
        {active ? `${humanDate(active)} — ${describe(activeStats)}` : 'Tap a day for its breakdown.'}
      </p>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('h-2.5 w-2.5 rounded-[4px]', className)} />
      {label}
    </span>
  );
}

function describe(stats?: DayPunctuality): string {
  if (!stats || stats.total === 0) return 'nothing scheduled';
  const parts: string[] = [];
  if (stats.ontime) parts.push(`${stats.ontime} on time`);
  if (stats.late) parts.push(`${stats.late} late`);
  if (stats.missed) parts.push(`${stats.missed} missed`);
  return parts.join(', ');
}

/** Worst outcome of the day wins the colour; intensity follows how much of it. */
function cellClass(stats: DayPunctuality | undefined, future: boolean): string {
  if (future) return 'bg-black/[0.03] dark:bg-white/[0.04]';
  if (!stats || stats.total === 0) return 'bg-black/[0.06] dark:bg-white/[0.07]';

  const missedShare = stats.missed / stats.total;
  const lateShare = stats.late / stats.total;

  if (missedShare >= 0.5) return 'bg-[#FF453A]';
  if (missedShare > 0) return 'bg-[#FF453A]/55';
  if (lateShare >= 0.5) return 'bg-[#FF9F0A]';
  if (lateShare > 0) return 'bg-[#FF9F0A]/55';
  return stats.ontime >= 3 ? 'bg-[#30D158]' : 'bg-[#30D158]/60';
}
