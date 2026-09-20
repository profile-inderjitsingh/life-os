import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import {
  addKeyDays,
  addMonths,
  daysInMonth,
  fromKey,
  humanDate,
  isFuture,
  monthLabel,
  rangeKeys,
  toKey,
  todayKey,
} from '@/lib/date';
import { useApp } from '@/store/AppContext';

const PAST_DAYS = 120;
const FUTURE_DAYS = 14;

/**
 * The Time Machine control. Scrubbing the strip or picking a date from the
 * calendar rewinds every screen in the app to that day's state.
 */
export function DateStrip({ title }: { title: string }) {
  const { date, setDate, goToToday, isTimeTravelling } = useApp();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const days = useMemo(
    () => rangeKeys(addKeyDays(todayKey(), -PAST_DAYS), addKeyDays(todayKey(), FUTURE_DAYS)),
    []
  );

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [date]);

  return (
    <header className="sticky top-0 z-20 bg-[#F2F2F7]/80 backdrop-blur-xl dark:bg-black/70">
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="flex items-end justify-between px-4 pb-1 pt-2">
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight">{title}</h1>
            <p
              className={cn(
                'text-[13px] font-medium',
                isTimeTravelling ? 'text-ios-orange' : 'text-black/45 dark:text-white/45'
              )}
            >
              {humanDate(date)}
              {isTimeTravelling && ' · viewing the past'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            {isTimeTravelling && (
              <Pressable
                onClick={goToToday}
                className="flex h-9 items-center gap-1.5 rounded-full bg-ios-orange/15 px-3 text-[13px] font-semibold text-ios-orange"
              >
                <RotateCcw size={14} strokeWidth={2.6} />
                Today
              </Pressable>
            )}
            <Pressable
              onClick={() => setCalendarOpen(true)}
              aria-label="Open calendar"
              className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.06] text-ios-blue dark:bg-white/[0.10]"
            >
              <CalendarDays size={19} />
            </Pressable>
          </div>
        </div>

        <div
          ref={scroller}
          className="ios-scroll flex gap-1.5 overflow-x-auto px-4 pb-2.5 pt-1"
        >
          {days.map((key) => {
            const d = fromKey(key);
            const selected = key === date;
            const today = key === todayKey();
            const future = isFuture(key);
            return (
              <button
                key={key}
                ref={selected ? selectedRef : undefined}
                type="button"
                onClick={() => setDate(key)}
                className="relative shrink-0"
              >
                <div
                  className={cn(
                    'flex h-[58px] w-[46px] flex-col items-center justify-center gap-0.5 rounded-2xl',
                    'transition-colors duration-200',
                    selected
                      ? 'text-white'
                      : future
                        ? 'text-black/25 dark:text-white/25'
                        : 'text-black/70 dark:text-white/70'
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="date-pill"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      className={cn(
                        'absolute inset-0 rounded-2xl',
                        today ? 'bg-ios-blue' : 'bg-black/80 dark:bg-white/90 dark:mix-blend-normal'
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'relative text-[11px] font-medium uppercase',
                      selected && !today && 'text-white dark:text-black'
                    )}
                  >
                    {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
                  </span>
                  <span
                    className={cn(
                      'relative text-[17px] font-semibold tabular-nums',
                      selected && !today && 'text-white dark:text-black'
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {today && !selected && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-ios-blue" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <CalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selected={date}
        onSelect={(key) => {
          setDate(key);
          setCalendarOpen(false);
        }}
      />
    </header>
  );
}

function CalendarSheet({
  open,
  onOpenChange,
  selected,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const [cursor, setCursor] = useState(() => fromKey(selected));

  useEffect(() => {
    if (open) setCursor(fromKey(selected));
  }, [open, selected]);

  const days = daysInMonth(cursor);
  const leadingBlanks = days[0].getDay();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Jump to a day">
      <div className="pb-2">
        <div className="mb-3 flex items-center justify-between">
          <Pressable
            onClick={() => setCursor(addMonths(cursor, -1))}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-full text-ios-blue"
          >
            <ChevronLeft size={22} />
          </Pressable>
          <span className="text-[17px] font-semibold">{monthLabel(cursor)}</span>
          <Pressable
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-full text-ios-blue"
          >
            <ChevronRight size={22} />
          </Pressable>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-black/40 dark:text-white/40">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {days.map((d) => {
            const key = toKey(d);
            const isSelected = key === selected;
            const today = key === todayKey();
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className="grid place-items-center py-0.5"
              >
                <span
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full text-[17px] tabular-nums',
                    isSelected && 'bg-ios-blue font-semibold text-white',
                    !isSelected && today && 'font-semibold text-ios-blue',
                    !isSelected && isFuture(key) && 'text-black/25 dark:text-white/25'
                  )}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <Pressable
          onClick={() => onSelect(todayKey())}
          className="mt-4 w-full rounded-2xl bg-black/[0.06] py-3 text-[17px] font-semibold text-ios-blue dark:bg-white/[0.10]"
        >
          Back to today
        </Pressable>
      </div>
    </Sheet>
  );
}
