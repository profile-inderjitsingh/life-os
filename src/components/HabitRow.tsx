import { motion } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Pressable } from '@/components/ui/Pressable';
import { Stepper } from '@/components/ui/Stepper';
import { SwipeRow } from '@/components/ui/SwipeRow';
import { cn } from '@/lib/cn';
import { achievedUnit, achievedValue, formatNumber, habitProgress } from '@/lib/habits';
import { spring } from '@/lib/haptics';
import type { Habit, HabitEntry } from '@/types';

export function HabitRow({
  habit,
  entry,
  onToggle,
  onStep,
  onOpenInput,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  entry?: HabitEntry;
  onToggle: () => void;
  onStep: (direction: 1 | -1) => void;
  onOpenInput: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = habitProgress(habit, entry);
  const done = progress >= 1;
  const value = achievedValue(habit, entry);
  const unit = achievedUnit(habit);

  return (
    <SwipeRow
      actions={[
        { label: 'Delete', icon: <Trash2 size={19} />, onSelect: onDelete, tone: 'destructive' },
        { label: 'Edit', icon: <Pencil size={19} />, onSelect: onEdit, tone: 'neutral' },
      ]}
    >
      <div className="flex items-center gap-3 bg-white p-4 dark:bg-[#1C1C1E]">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]"
          style={{ backgroundColor: `${habit.color}22` }}
        >
          {habit.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-[17px] font-medium leading-tight',
              done && 'text-black/40 dark:text-white/40'
            )}
          >
            {habit.name}
          </p>

          {habit.type === 'binary' ? (
            <p className="text-[13px] text-black/40 dark:text-white/40">
              {done ? 'Done today' : 'Not yet'}
            </p>
          ) : (
            <>
              <p className="text-[13px] tabular-nums text-black/45 dark:text-white/45">
                {formatNumber(value)}
                {unit && ` ${unit}`} of {formatNumber(habit.target)}
                {unit && ` ${unit}`}
                {habit.type === 'calculated' && entry && (
                  <span className="text-black/30 dark:text-white/30">
                    {' '}
                    · from {formatNumber(entry.value)}
                    {habit.inputUnit}
                  </span>
                )}
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.10]">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.min(100, progress * 100)}%` }}
                  transition={spring.gentle}
                  className="h-full rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
              </div>
            </>
          )}
        </div>

        {habit.type === 'binary' && (
          <Pressable
            onClick={onToggle}
            feedback={done ? 'light' : 'success'}
            squish={0.85}
            aria-label={done ? `Mark ${habit.name} not done` : `Mark ${habit.name} done`}
            className={cn(
              'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-2 transition-colors',
              done ? 'border-transparent text-white' : 'border-black/15 dark:border-white/25'
            )}
            style={done ? { backgroundColor: habit.color } : undefined}
          >
            {done && <Check size={19} strokeWidth={3.2} />}
          </Pressable>
        )}

        {habit.type === 'stepper' && (
          <Stepper
            onDecrement={() => onStep(-1)}
            onIncrement={() => onStep(1)}
            canDecrement={(entry?.value ?? 0) > 0}
          />
        )}

        {habit.type === 'calculated' && (
          <Pressable
            onClick={onOpenInput}
            className="shrink-0 rounded-full bg-black/[0.07] px-3.5 py-2 text-[15px] font-semibold text-ios-blue dark:bg-white/[0.12]"
          >
            Log
          </Pressable>
        )}
      </div>
    </SwipeRow>
  );
}
