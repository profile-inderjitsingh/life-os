import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

const ITEM = 40;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];

function Column({
  values,
  index,
  onIndexChange,
  format,
  align,
}: {
  values: Array<string | number>;
  index: number;
  onIndexChange: (next: number) => void;
  format?: (value: string | number) => string;
  align: 'right' | 'center' | 'left';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  const lastReported = useRef(index);

  // Jump to the value when it changes from outside (e.g. the "Now" button).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (Math.round(node.scrollTop / ITEM) === index) return;
    lastReported.current = index;
    node.scrollTo({ top: index * ITEM, behavior: 'auto' });
  }, [index]);

  const handleScroll = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const next = Math.max(0, Math.min(values.length - 1, Math.round(node.scrollTop / ITEM)));
      if (next !== lastReported.current) {
        lastReported.current = next;
        haptic('light');
        onIndexChange(next);
      }
    }, 90);
  }, [onIndexChange, values.length]);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="ios-scroll h-[200px] flex-1 snap-y snap-mandatory overflow-y-auto"
      style={{ scrollPaddingTop: PAD }}
    >
      <div style={{ height: PAD }} />
      {values.map((value, i) => (
        <div
          key={String(value)}
          style={{ height: ITEM }}
          className={cn(
            'flex snap-center items-center text-[22px] tabular-nums transition-[opacity,transform] duration-150',
            align === 'right' && 'justify-end pr-3',
            align === 'center' && 'justify-center',
            align === 'left' && 'justify-start pl-3',
            i === index
              ? 'font-semibold opacity-100'
              : 'scale-90 opacity-35'
          )}
        >
          {format ? format(value) : value}
        </div>
      ))}
      <div style={{ height: PAD }} />
    </div>
  );
}

/**
 * Minutes since midnight, edited the way iOS does it: three inertial columns
 * behind a fixed selection band.
 */
export function TimeWheel({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  const hour24 = Math.floor(minutes / 60);
  const periodIndex = hour24 >= 12 ? 1 : 0;
  const hourIndex = (hour24 % 12 === 0 ? 12 : hour24 % 12) - 1;
  const minuteIndex = minutes % 60;

  const emit = (h: number, m: number, p: number) => {
    const hour12 = HOURS[h];
    const base = hour12 % 12;
    onChange((base + p * 12) * 60 + m);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[40px] -translate-y-1/2 rounded-xl bg-black/[0.06] dark:bg-white/[0.10]" />
      <div className="relative flex">
        <Column
          values={HOURS}
          index={hourIndex}
          align="right"
          onIndexChange={(i) => emit(i, minuteIndex, periodIndex)}
        />
        <Column
          values={MINUTES}
          index={minuteIndex}
          align="center"
          format={(v) => String(v).padStart(2, '0')}
          onIndexChange={(i) => emit(hourIndex, i, periodIndex)}
        />
        <Column
          values={PERIODS}
          index={periodIndex}
          align="left"
          onIndexChange={(i) => emit(hourIndex, minuteIndex, i)}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent dark:from-[#1C1C1E]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent dark:from-[#1C1C1E]" />
    </div>
  );
}
