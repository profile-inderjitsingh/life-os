/**
 * Domain types for Life OS.
 * `DateKey` is always a local-time `YYYY-MM-DD` string — never a UTC timestamp,
 * so a day never shifts under the user when they travel or cross midnight.
 */
export type DateKey = string;

export type HabitType = 'binary' | 'stepper' | 'calculated';

export interface Habit {
  id?: number;
  name: string;
  emoji: string;
  /** Tailwind-independent hex, used for rings, charts and accents. */
  color: string;
  type: HabitType;
  /** Daily goal. Binary habits are always 1. */
  target: number;
  /** Stepper increment, e.g. 1 glass or 0.5 km. */
  step: number;
  /** Unit shown next to the value, e.g. "glasses". */
  unit: string;
  /** Calculated habits: what the user types in, e.g. "Chicken". */
  inputLabel: string;
  inputUnit: string;
  /** Calculated habits: what it becomes, e.g. "Protein". */
  outputLabel: string;
  outputUnit: string;
  /** derived = raw * factor. e.g. 0.31 for chicken → protein. */
  factor: number;
  archived: 0 | 1;
  order: number;
  createdAt: string;
}

export interface HabitEntry {
  id?: number;
  habitId: number;
  date: DateKey;
  /** Raw value: 0|1 for binary, count for stepper, input amount for calculated. */
  value: number;
  /** Calculated habits only: value * factor, stored so history survives factor edits. */
  derived: number;
  updatedAt: string;
}

export type Punctuality = 'ontime' | 'late' | 'missed' | 'untimed';

export interface Task {
  id?: number;
  title: string;
  notes: string;
  date: DateKey;
  /** Minutes since local midnight, or null for an anytime task. */
  scheduledMinutes: number | null;
  done: 0 | 1;
  completedAt: string | null;
  punctuality: Punctuality | null;
  /** Positive = finished late, negative = finished early. */
  delayMinutes: number | null;
  order: number;
  createdAt: string;
}

export interface JournalTemplate {
  id?: number;
  name: string;
  /** Static prompts the user answers each day. */
  keys: string[];
  order: number;
  createdAt: string;
}

export interface JournalPair {
  key: string;
  value: string;
}

export interface JournalEntry {
  id?: number;
  templateId: number;
  date: DateKey;
  pairs: JournalPair[];
  updatedAt: string;
}

export type WidgetId =
  | 'rings'
  | 'streaks'
  | 'heatmap'
  | 'timeOfDay'
  | 'trends'
  | 'tasks'
  | 'habits';

export interface WidgetPref {
  id: WidgetId;
  visible: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  id: 'app';
  widgets: WidgetPref[];
  theme: ThemeMode;
  /** Minutes after the scheduled time that still counts as on time. */
  graceMinutes: number;
  trendHabitId: number | null;
}

export interface DayStats {
  habits: number; // 0..1
  tasks: number; // 0..1
  journal: number; // 0..1
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  journalDone: number;
  journalTotal: number;
}

export interface DayPunctuality {
  date: DateKey;
  ontime: number;
  late: number;
  missed: number;
  total: number;
}

export interface BackupFile {
  app: 'life-os';
  version: number;
  exportedAt: string;
  habits: Habit[];
  habitEntries: HabitEntry[];
  tasks: Task[];
  journalTemplates: JournalTemplate[];
  journalEntries: JournalEntry[];
  settings: Settings | null;
}
