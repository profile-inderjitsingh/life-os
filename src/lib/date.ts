import type { DateKey } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time YYYY-MM-DD. */
export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addKeyDays(key: DateKey, days: number): DateKey {
  return toKey(addDays(fromKey(key), days));
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function daysInMonth(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const out: Date[] = [];
  for (let i = 1; i <= end.getDate(); i++) {
    out.push(new Date(start.getFullYear(), start.getMonth(), i));
  }
  return out;
}

/** Inclusive range of date keys. */
export function rangeKeys(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  let cursor = fromKey(from);
  const end = fromKey(to);
  while (cursor <= end) {
    out.push(toKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function lastNDays(n: number, endKey: DateKey = todayKey()): DateKey[] {
  return rangeKeys(addKeyDays(endKey, -(n - 1)), endKey);
}

export function isToday(key: DateKey): boolean {
  return key === todayKey();
}

export function isFuture(key: DateKey): boolean {
  return key > todayKey();
}

export function isPast(key: DateKey): boolean {
  return key < todayKey();
}

/** "Today", "Yesterday", "Tomorrow", otherwise "Mon 14 Jun". */
export function humanDate(key: DateKey): string {
  if (isToday(key)) return 'Today';
  if (key === addKeyDays(todayKey(), -1)) return 'Yesterday';
  if (key === addKeyDays(todayKey(), 1)) return 'Tomorrow';
  const d = fromKey(key);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
}

export function longDate(key: DateKey): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function weekdayInitial(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'narrow' });
}

/** 450 → "7:30 AM" */
export function formatMinutes(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${period}`;
}

export function minutesNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** 42 → "42 min", 135 → "2h 15m" */
export function formatDuration(mins: number): string {
  const abs = Math.abs(Math.round(mins));
  if (abs < 60) return `${abs} min`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export type TimeBucket = 'morning' | 'afternoon' | 'evening';

export function bucketOf(minutes: number): TimeBucket {
  if (minutes < 12 * 60) return 'morning';
  if (minutes < 17 * 60) return 'afternoon';
  return 'evening';
}

export const BUCKET_LABEL: Record<TimeBucket, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};
