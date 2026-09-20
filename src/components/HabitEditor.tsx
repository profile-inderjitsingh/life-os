import { useEffect, useState } from 'react';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { FieldLabel, TextField } from '@/components/ui/Field';
import { DataService } from '@/db/DataService';
import { cn } from '@/lib/cn';
import { HABIT_COLORS, HABIT_EMOJI } from '@/lib/habits';
import type { Habit, HabitType } from '@/types';

const TYPES: Array<{ value: HabitType; label: string; hint: string }> = [
  { value: 'binary', label: 'Done or not', hint: 'One tap to tick it off.' },
  { value: 'stepper', label: 'Count', hint: 'Tap + and − through the day.' },
  { value: 'calculated', label: 'Convert', hint: 'Log a raw amount, track what it becomes.' },
];

interface Draft {
  name: string;
  emoji: string;
  color: string;
  type: HabitType;
  target: string;
  step: string;
  unit: string;
  inputLabel: string;
  inputUnit: string;
  outputLabel: string;
  outputUnit: string;
  factor: string;
}

const EMPTY: Draft = {
  name: '',
  emoji: '✅',
  color: HABIT_COLORS[5],
  type: 'binary',
  target: '1',
  step: '1',
  unit: '',
  inputLabel: '',
  inputUnit: 'g',
  outputLabel: '',
  outputUnit: 'g',
  factor: '1',
};

function toDraft(habit: Habit): Draft {
  return {
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    type: habit.type,
    target: String(habit.target),
    step: String(habit.step),
    unit: habit.unit,
    inputLabel: habit.inputLabel,
    inputUnit: habit.inputUnit,
    outputLabel: habit.outputLabel,
    outputUnit: habit.outputUnit,
    factor: String(habit.factor),
  };
}

export function HabitEditor({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);

  useEffect(() => {
    if (open) setDraft(habit ? toDraft(habit) : EMPTY);
  }, [open, habit]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const num = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const save = async () => {
    const payload = {
      name: draft.name.trim(),
      emoji: draft.emoji,
      color: draft.color,
      type: draft.type,
      target: draft.type === 'binary' ? 1 : num(draft.target, 1),
      step: num(draft.step, 1),
      unit: draft.unit.trim(),
      inputLabel: draft.inputLabel.trim(),
      inputUnit: draft.inputUnit.trim(),
      outputLabel: draft.outputLabel.trim(),
      outputUnit: draft.outputUnit.trim(),
      factor: draft.type === 'calculated' ? num(draft.factor, 1) : 1,
    };
    if (!payload.name) return;

    if (habit?.id) await DataService.habits.update(habit.id, payload);
    else await DataService.habits.create(payload);
    onOpenChange(false);
  };

  const preview = (() => {
    const factor = num(draft.factor, 1);
    const sample = 100;
    return `${sample}${draft.inputUnit || ''} ${draft.inputLabel || 'input'} → ${Math.round(
      sample * factor * 100
    ) / 100}${draft.outputUnit || ''} ${draft.outputLabel || 'result'}`;
  })();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={habit ? 'Edit habit' : 'New habit'}
      action={{ label: 'Save', onClick: save, disabled: !draft.name.trim() }}
      fullHeight
    >
      <div className="flex flex-col gap-5 pb-6">
        <div>
          <FieldLabel>Name</FieldLabel>
          <TextField
            value={draft.name}
            autoFocus={!habit}
            placeholder="Drink water"
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div>
          <FieldLabel>Icon</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {HABIT_EMOJI.map((emoji) => (
              <Pressable
                key={emoji}
                onClick={() => set('emoji', emoji)}
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-2xl text-[22px]',
                  draft.emoji === emoji
                    ? 'bg-ios-blue/15 ring-2 ring-ios-blue'
                    : 'bg-black/[0.05] dark:bg-white/[0.08]'
                )}
              >
                {emoji}
              </Pressable>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Colour</FieldLabel>
          <div className="flex flex-wrap gap-2.5">
            {HABIT_COLORS.map((color) => (
              <Pressable
                key={color}
                onClick={() => set('color', color)}
                aria-label={`Colour ${color}`}
                className={cn(
                  'h-9 w-9 rounded-full',
                  draft.color === color &&
                    'ring-2 ring-black/70 ring-offset-2 ring-offset-white dark:ring-white/80 dark:ring-offset-[#1C1C1E]'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>How you log it</FieldLabel>
          <div className="flex flex-col gap-2">
            {TYPES.map((type) => (
              <Pressable
                key={type.value}
                onClick={() => set('type', type.value)}
                className={cn(
                  'rounded-2xl px-4 py-3 text-left',
                  draft.type === type.value
                    ? 'bg-ios-blue/12 ring-2 ring-ios-blue'
                    : 'bg-black/[0.05] dark:bg-white/[0.08]'
                )}
              >
                <p className="text-[16px] font-medium">{type.label}</p>
                <p className="text-[13px] text-black/50 dark:text-white/45">{type.hint}</p>
              </Pressable>
            ))}
          </div>
        </div>

        {draft.type === 'stepper' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Daily goal</FieldLabel>
              <TextField
                inputMode="decimal"
                value={draft.target}
                onChange={(e) => set('target', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Step</FieldLabel>
              <TextField
                inputMode="decimal"
                value={draft.step}
                onChange={(e) => set('step', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <TextField
                value={draft.unit}
                placeholder="glasses"
                onChange={(e) => set('unit', e.target.value)}
              />
            </div>
          </div>
        )}

        {draft.type === 'calculated' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>You log</FieldLabel>
                <TextField
                  value={draft.inputLabel}
                  placeholder="Chicken"
                  onChange={(e) => set('inputLabel', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>In</FieldLabel>
                <TextField
                  value={draft.inputUnit}
                  placeholder="g"
                  onChange={(e) => set('inputUnit', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>It becomes</FieldLabel>
                <TextField
                  value={draft.outputLabel}
                  placeholder="Protein"
                  onChange={(e) => set('outputLabel', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>In</FieldLabel>
                <TextField
                  value={draft.outputUnit}
                  placeholder="g"
                  onChange={(e) => set('outputUnit', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Multiply by</FieldLabel>
                <TextField
                  inputMode="decimal"
                  value={draft.factor}
                  onChange={(e) => set('factor', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Daily goal</FieldLabel>
                <TextField
                  inputMode="decimal"
                  value={draft.target}
                  onChange={(e) => set('target', e.target.value)}
                />
              </div>
            </div>
            <p className="rounded-2xl bg-black/[0.04] px-4 py-3 text-[13px] text-black/55 dark:bg-white/[0.06] dark:text-white/50">
              {preview}
            </p>
          </div>
        )}

        {habit?.id && (
          <Pressable
            onClick={async () => {
              await DataService.habits.remove(habit.id!);
              onOpenChange(false);
            }}
            feedback="warning"
            className="rounded-2xl bg-[#FF453A]/10 py-3 text-[17px] font-semibold text-[#FF453A]"
          >
            Delete habit and its history
          </Pressable>
        )}
      </div>
    </Sheet>
  );
}
