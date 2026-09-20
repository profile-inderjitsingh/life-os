import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldLabel, TextField } from '@/components/ui/Field';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { DataService } from '@/db/DataService';
import { humanDate } from '@/lib/date';
import { deriveValue, formatNumber } from '@/lib/habits';
import type { DateKey, Habit, HabitEntry } from '@/types';

/**
 * Where a calculated habit gets its raw number. The conversion is shown while
 * typing so the maths never feels like a black box.
 */
export function HabitLogSheet({
  open,
  onOpenChange,
  habit,
  entry,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  entry?: HabitEntry;
  date: DateKey;
}) {
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (open) setRaw(entry?.value ? String(entry.value) : '');
  }, [open, entry]);

  if (!habit) return null;

  const parsed = Number(raw);
  const valid = Number.isFinite(parsed) && parsed >= 0;
  const derived = valid ? deriveValue(habit, parsed) : 0;
  const pct = habit.target > 0 ? Math.min(100, (derived / habit.target) * 100) : 0;

  const save = async () => {
    if (!valid) return;
    await DataService.entries.setValue(habit, date, parsed);
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={habit.name}
      action={{ label: 'Save', onClick: save, disabled: !valid }}
    >
      <div className="flex flex-col gap-4 pb-4">
        <p className="text-[13px] text-black/45 dark:text-white/45">{humanDate(date)}</p>

        <div>
          <FieldLabel>
            {habit.inputLabel || 'Amount'}
            {habit.inputUnit && ` (${habit.inputUnit})`}
          </FieldLabel>
          <TextField
            value={raw}
            autoFocus
            inputMode="decimal"
            placeholder="0"
            className="text-[28px] font-semibold tabular-nums"
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center gap-4 rounded-card bg-white p-5 dark:bg-[#1C1C1E]">
          <div className="text-center">
            <p className="text-[24px] font-bold tabular-nums">
              {formatNumber(valid ? parsed : 0)}
              <span className="text-[14px] text-black/40 dark:text-white/40">{habit.inputUnit}</span>
            </p>
            <p className="text-[12px] text-black/45 dark:text-white/45">
              {habit.inputLabel || 'Input'}
            </p>
          </div>
          <ArrowRight size={18} className="text-black/25 dark:text-white/25" />
          <div className="text-center">
            <p className="text-[24px] font-bold tabular-nums" style={{ color: habit.color }}>
              {formatNumber(derived)}
              <span className="text-[14px] opacity-60">{habit.outputUnit}</span>
            </p>
            <p className="text-[12px] text-black/45 dark:text-white/45">
              {habit.outputLabel || 'Result'}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-[13px] text-black/45 dark:text-white/45">
            <span>Toward today&rsquo;s goal</span>
            <span className="tabular-nums">
              {formatNumber(derived)} / {formatNumber(habit.target)}
              {habit.outputUnit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.10]">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${pct}%`, backgroundColor: habit.color }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {[50, 100, 150, 200].map((amount) => (
            <Pressable
              key={amount}
              onClick={() => setRaw(String(amount))}
              className="flex-1 rounded-xl bg-black/[0.05] py-2.5 text-[15px] font-medium text-ios-blue dark:bg-white/[0.08]"
            >
              {amount}
              {habit.inputUnit}
            </Pressable>
          ))}
        </div>

        {entry && (
          <Pressable
            onClick={async () => {
              await DataService.entries.setValue(habit, date, 0);
              onOpenChange(false);
            }}
            className="rounded-2xl bg-black/[0.05] py-3 text-[17px] font-medium text-[#FF453A] dark:bg-white/[0.08]"
          >
            Clear this day
          </Pressable>
        )}
      </div>
    </Sheet>
  );
}
