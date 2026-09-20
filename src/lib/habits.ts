import type { Habit, HabitEntry } from '@/types';

/** What a habit entry is worth today, as a 0..1 fraction of its goal. */
export function habitProgress(habit: Habit, entry?: HabitEntry | null): number {
  if (!entry) return 0;
  if (habit.type === 'binary') return entry.value >= 1 ? 1 : 0;
  const target = habit.target > 0 ? habit.target : 1;
  const achieved = habit.type === 'calculated' ? entry.derived : entry.value;
  return Math.max(0, Math.min(1, achieved / target));
}

export function isHabitComplete(habit: Habit, entry?: HabitEntry | null): boolean {
  return habitProgress(habit, entry) >= 1;
}

/** The number the user cares about: reps, glasses, or the derived metric. */
export function achievedValue(habit: Habit, entry?: HabitEntry | null): number {
  if (!entry) return 0;
  return habit.type === 'calculated' ? entry.derived : entry.value;
}

export function achievedUnit(habit: Habit): string {
  return habit.type === 'calculated' ? habit.outputUnit : habit.unit;
}

export function deriveValue(habit: Habit, raw: number): number {
  if (habit.type !== 'calculated') return raw;
  return Math.round(raw * habit.factor * 100) / 100;
}

/** Trims trailing zeros: 62.00 → "62", 2.50 → "2.5". */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n * 100) / 100);
}

export const HABIT_COLORS = [
  '#FF375F',
  '#FF9F0A',
  '#FFD60A',
  '#30D158',
  '#66D4CF',
  '#0A84FF',
  '#5E5CE6',
  '#BF5AF2',
];

export const HABIT_EMOJI = [
  '💧',
  '🏃',
  '📚',
  '🧘',
  '🍗',
  '💊',
  '🛏️',
  '🎸',
  '✍️',
  '🚭',
  '🧹',
  '☀️',
];
