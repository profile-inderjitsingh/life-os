import { db } from './db';
import {
  addKeyDays,
  bucketOf,
  fromKey,
  isPast,
  lastNDays,
  minutesNow,
  toKey,
  todayKey,
  type TimeBucket,
} from '@/lib/date';
import { deriveValue, habitProgress, isHabitComplete } from '@/lib/habits';
import type {
  BackupFile,
  DateKey,
  DayPunctuality,
  DayStats,
  Habit,
  HabitEntry,
  JournalEntry,
  JournalPair,
  JournalTemplate,
  Punctuality,
  Settings,
  Task,
  ThemeMode,
  WidgetId,
  WidgetPref,
} from '@/types';

const now = () => new Date().toISOString();

export const DEFAULT_WIDGETS: WidgetPref[] = [
  { id: 'rings', visible: true },
  { id: 'streaks', visible: true },
  { id: 'tasks', visible: true },
  { id: 'habits', visible: true },
  { id: 'heatmap', visible: true },
  { id: 'timeOfDay', visible: true },
  { id: 'trends', visible: true },
];

const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  widgets: DEFAULT_WIDGETS,
  theme: 'system',
  graceMinutes: 5,
  trendHabitId: null,
};

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

const habits = {
  async list(includeArchived = false): Promise<Habit[]> {
    const all = await db.habits.orderBy('order').toArray();
    return includeArchived ? all : all.filter((h) => !h.archived);
  },

  async get(id: number): Promise<Habit | undefined> {
    return db.habits.get(id);
  },

  async create(input: Partial<Habit> & { name: string }): Promise<number> {
    const count = await db.habits.count();
    const habit: Habit = {
      name: input.name.trim(),
      emoji: input.emoji ?? '✅',
      color: input.color ?? '#0A84FF',
      type: input.type ?? 'binary',
      target: input.target ?? 1,
      step: input.step ?? 1,
      unit: input.unit ?? '',
      inputLabel: input.inputLabel ?? '',
      inputUnit: input.inputUnit ?? '',
      outputLabel: input.outputLabel ?? '',
      outputUnit: input.outputUnit ?? '',
      factor: input.factor ?? 1,
      archived: 0,
      order: input.order ?? count,
      createdAt: now(),
    };
    return db.habits.add(habit);
  },

  async update(id: number, patch: Partial<Habit>): Promise<void> {
    await db.habits.update(id, patch);
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await db.transaction('rw', db.habits, async () => {
      await Promise.all(orderedIds.map((id, index) => db.habits.update(id, { order: index })));
    });
  },

  /** Removes the habit and every entry it ever produced. */
  async remove(id: number): Promise<void> {
    await db.transaction('rw', db.habits, db.habitEntries, async () => {
      await db.habitEntries.where('habitId').equals(id).delete();
      await db.habits.delete(id);
    });
  },

  async archive(id: number, archived: boolean): Promise<void> {
    await db.habits.update(id, { archived: archived ? 1 : 0 });
  },
};

/* ------------------------------------------------------------------ */
/* Habit entries                                                       */
/* ------------------------------------------------------------------ */

const entries = {
  async forDate(date: DateKey): Promise<HabitEntry[]> {
    return db.habitEntries.where('date').equals(date).toArray();
  },

  async forHabit(habitId: number): Promise<HabitEntry[]> {
    return db.habitEntries.where('habitId').equals(habitId).toArray();
  },

  async get(habitId: number, date: DateKey): Promise<HabitEntry | undefined> {
    return db.habitEntries.where('[habitId+date]').equals([habitId, date]).first();
  },

  /** Writes the raw value for a day and recomputes the derived metric. */
  async setValue(habit: Habit, date: DateKey, value: number): Promise<void> {
    const id = habit.id!;
    const clean = Number.isFinite(value) ? Math.max(0, value) : 0;
    const derived = deriveValue(habit, clean);
    const existing = await entries.get(id, date);

    if (clean === 0 && existing?.id) {
      await db.habitEntries.delete(existing.id);
      return;
    }
    if (existing?.id) {
      await db.habitEntries.update(existing.id, { value: clean, derived, updatedAt: now() });
    } else if (clean > 0) {
      await db.habitEntries.add({ habitId: id, date, value: clean, derived, updatedAt: now() });
    }
  },

  async toggle(habit: Habit, date: DateKey): Promise<void> {
    const existing = await entries.get(habit.id!, date);
    const isOn = (existing?.value ?? 0) >= 1;
    await entries.setValue(habit, date, isOn ? 0 : 1);
  },

  async step(habit: Habit, date: DateKey, direction: 1 | -1): Promise<void> {
    const existing = await entries.get(habit.id!, date);
    const next = (existing?.value ?? 0) + direction * (habit.step || 1);
    await entries.setValue(habit, date, Math.max(0, Math.round(next * 100) / 100));
  },

  /** Daily totals for one habit — used by the trend chart. */
  async series(habitId: number, dates: DateKey[]): Promise<number[]> {
    const habit = await db.habits.get(habitId);
    if (!habit) return dates.map(() => 0);
    const all = await db.habitEntries.where('habitId').equals(habitId).toArray();
    const byDate = new Map(all.map((e) => [e.date, e]));
    return dates.map((d) => {
      const entry = byDate.get(d);
      if (!entry) return 0;
      return habit.type === 'calculated' ? entry.derived : entry.value;
    });
  },
};

/* ------------------------------------------------------------------ */
/* Tasks + punctuality engine                                          */
/* ------------------------------------------------------------------ */

/**
 * Compares completion time against the scheduled time.
 * Backfilled past days are judged against the end of that day, because the
 * user genuinely did not confirm it on time — that is the honest reading.
 */
function judge(
  task: Task,
  date: DateKey,
  graceMinutes: number
): { punctuality: Punctuality; delayMinutes: number | null } {
  if (task.scheduledMinutes === null) return { punctuality: 'untimed', delayMinutes: null };
  const completedAtMinutes = date === todayKey() ? minutesNow() : isPast(date) ? 24 * 60 - 1 : 0;
  const delta = completedAtMinutes - task.scheduledMinutes;
  return {
    punctuality: delta <= graceMinutes ? 'ontime' : 'late',
    delayMinutes: delta,
  };
}

const tasks = {
  async forDate(date: DateKey): Promise<Task[]> {
    const list = await db.tasks.where('date').equals(date).toArray();
    return list.sort((a, b) => {
      // Scheduled tasks lead the list in clock order, anytime tasks follow.
      const am = a.scheduledMinutes ?? Number.MAX_SAFE_INTEGER;
      const bm = b.scheduledMinutes ?? Number.MAX_SAFE_INTEGER;
      if (am !== bm) return am - bm;
      return a.order - b.order;
    });
  },

  async get(id: number): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  async create(input: Partial<Task> & { title: string; date: DateKey }): Promise<number> {
    const count = await db.tasks.where('date').equals(input.date).count();
    const task: Task = {
      title: input.title.trim(),
      notes: input.notes ?? '',
      date: input.date,
      scheduledMinutes: input.scheduledMinutes ?? null,
      done: 0,
      completedAt: null,
      punctuality: null,
      delayMinutes: null,
      order: count,
      createdAt: now(),
    };
    return db.tasks.add(task);
  },

  async update(id: number, patch: Partial<Task>): Promise<void> {
    await db.tasks.update(id, patch);
  },

  async remove(id: number): Promise<void> {
    await db.tasks.delete(id);
  },

  /** Marking done runs the punctuality audit; un-marking clears it. */
  async toggleDone(id: number): Promise<Task | undefined> {
    const task = await db.tasks.get(id);
    if (!task) return undefined;

    if (task.done) {
      await db.tasks.update(id, {
        done: 0,
        completedAt: null,
        punctuality: null,
        delayMinutes: null,
      });
      return db.tasks.get(id);
    }

    const settings = await settingsApi.get();
    const verdict = judge(task, task.date, settings.graceMinutes);
    await db.tasks.update(id, {
      done: 1,
      completedAt: now(),
      punctuality: verdict.punctuality,
      delayMinutes: verdict.delayMinutes,
    });
    return db.tasks.get(id);
  },

  async moveToDate(id: number, date: DateKey): Promise<void> {
    await db.tasks.update(id, { date });
  },

  /** Unfinished, scheduled tasks on days already gone. */
  async missedInRange(from: DateKey, to: DateKey): Promise<Task[]> {
    const all = await db.tasks.where('date').between(from, to, true, true).toArray();
    return all.filter((t) => !t.done && isPast(t.date) && t.scheduledMinutes !== null);
  },
};

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

const journal = {
  async templates(): Promise<JournalTemplate[]> {
    return db.journalTemplates.orderBy('order').toArray();
  },

  async createTemplate(name: string, keys: string[]): Promise<number> {
    const count = await db.journalTemplates.count();
    return db.journalTemplates.add({
      name: name.trim(),
      keys: keys.map((k) => k.trim()).filter(Boolean),
      order: count,
      createdAt: now(),
    });
  },

  async updateTemplate(id: number, patch: Partial<JournalTemplate>): Promise<void> {
    await db.journalTemplates.update(id, patch);
  },

  async removeTemplate(id: number): Promise<void> {
    await db.transaction('rw', db.journalTemplates, db.journalEntries, async () => {
      await db.journalEntries.where('templateId').equals(id).delete();
      await db.journalTemplates.delete(id);
    });
  },

  async entry(templateId: number, date: DateKey): Promise<JournalEntry | undefined> {
    return db.journalEntries.where('[templateId+date]').equals([templateId, date]).first();
  },

  async entriesForDate(date: DateKey): Promise<JournalEntry[]> {
    return db.journalEntries.where('date').equals(date).toArray();
  },

  async allEntries(): Promise<JournalEntry[]> {
    return db.journalEntries.orderBy('date').toArray();
  },

  /** Saves answers for a day; an entry with no filled values is deleted. */
  async save(templateId: number, date: DateKey, pairs: JournalPair[]): Promise<void> {
    const cleaned = pairs
      .map((p) => ({ key: p.key.trim(), value: p.value.trim() }))
      .filter((p) => p.key.length > 0);
    const hasContent = cleaned.some((p) => p.value.length > 0);
    const existing = await journal.entry(templateId, date);

    if (!hasContent) {
      if (existing?.id) await db.journalEntries.delete(existing.id);
      return;
    }
    if (existing?.id) {
      await db.journalEntries.update(existing.id, { pairs: cleaned, updatedAt: now() });
    } else {
      await db.journalEntries.add({ templateId, date, pairs: cleaned, updatedAt: now() });
    }
  },

  async removeEntry(id: number): Promise<void> {
    await db.journalEntries.delete(id);
  },
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const settingsApi = {
  async get(): Promise<Settings> {
    const stored = await db.settings.get('app');
    if (!stored) return DEFAULT_SETTINGS;
    // Merge so widgets added in a later release still appear.
    const known = new Set(stored.widgets.map((w) => w.id));
    const widgets = [
      ...stored.widgets,
      ...DEFAULT_WIDGETS.filter((w) => !known.has(w.id)),
    ];
    return { ...DEFAULT_SETTINGS, ...stored, widgets };
  },

  async save(patch: Partial<Settings>): Promise<void> {
    const current = await settingsApi.get();
    await db.settings.put({ ...current, ...patch, id: 'app' });
  },

  async setTheme(theme: ThemeMode): Promise<void> {
    await settingsApi.save({ theme });
  },

  async setWidgets(widgets: WidgetPref[]): Promise<void> {
    await settingsApi.save({ widgets });
  },

  async toggleWidget(id: WidgetId): Promise<void> {
    const current = await settingsApi.get();
    await settingsApi.save({
      widgets: current.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    });
  },
};

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

const analytics = {
  /** The three ring values for one day. */
  async dayStats(date: DateKey): Promise<DayStats> {
    const [habitList, entryList, taskList, templateList, journalList] = await Promise.all([
      habits.list(),
      entries.forDate(date),
      tasks.forDate(date),
      journal.templates(),
      journal.entriesForDate(date),
    ]);

    const entryByHabit = new Map(entryList.map((e) => [e.habitId, e]));
    const habitScore = habitList.reduce(
      (sum, h) => sum + habitProgress(h, entryByHabit.get(h.id!)),
      0
    );
    const habitsDone = habitList.filter((h) => isHabitComplete(h, entryByHabit.get(h.id!))).length;

    const tasksDone = taskList.filter((t) => t.done).length;

    const answered = new Set(
      journalList.filter((e) => e.pairs.some((p) => p.value.trim())).map((e) => e.templateId)
    );
    const journalDone = templateList.filter((t) => answered.has(t.id!)).length;

    return {
      habits: habitList.length ? habitScore / habitList.length : 0,
      tasks: taskList.length ? tasksDone / taskList.length : 0,
      journal: templateList.length ? journalDone / templateList.length : 0,
      habitsDone,
      habitsTotal: habitList.length,
      tasksDone,
      tasksTotal: taskList.length,
      journalDone,
      journalTotal: templateList.length,
    };
  },

  /**
   * Consecutive completed days ending at `date`.
   * Today still counts as alive if it is not done yet, so an untouched
   * morning does not look like a broken streak.
   */
  async streak(habitId: number, date: DateKey = todayKey()): Promise<number> {
    const habit = await db.habits.get(habitId);
    if (!habit) return 0;
    const all = await entries.forHabit(habitId);
    const byDate = new Map(all.map((e) => [e.date, e]));

    let count = 0;
    let cursor = date;
    if (!isHabitComplete(habit, byDate.get(cursor)) && cursor === todayKey()) {
      cursor = addKeyDays(cursor, -1);
    }
    while (isHabitComplete(habit, byDate.get(cursor))) {
      count += 1;
      cursor = addKeyDays(cursor, -1);
    }
    return count;
  },

  async allStreaks(date: DateKey = todayKey()): Promise<Array<{ habit: Habit; streak: number }>> {
    const list = await habits.list();
    const out = await Promise.all(
      list.map(async (habit) => ({ habit, streak: await analytics.streak(habit.id!, date) }))
    );
    return out.sort((a, b) => b.streak - a.streak);
  },

  /** Per-day on-time / late / missed counts, for the heatmap grid. */
  async punctualityRange(from: DateKey, to: DateKey): Promise<Map<DateKey, DayPunctuality>> {
    const all = await db.tasks.where('date').between(from, to, true, true).toArray();
    const map = new Map<DateKey, DayPunctuality>();

    for (const task of all) {
      const bucket =
        map.get(task.date) ?? { date: task.date, ontime: 0, late: 0, missed: 0, total: 0 };
      if (task.done) {
        if (task.punctuality === 'late') bucket.late += 1;
        else bucket.ontime += 1;
      } else if (isPast(task.date)) {
        bucket.missed += 1;
      } else {
        // Still open today or in the future — not counted against the user.
        map.set(task.date, bucket);
        continue;
      }
      bucket.total += 1;
      map.set(task.date, bucket);
    }
    return map;
  },

  /** Completion rate per part of the day, over the trailing window. */
  async timeOfDay(
    days = 30,
    endDate: DateKey = todayKey()
  ): Promise<Record<TimeBucket, { done: number; total: number; ontime: number }>> {
    const dates = lastNDays(days, endDate);
    const all = await db.tasks.where('date').between(dates[0], dates[dates.length - 1], true, true).toArray();
    const base = {
      morning: { done: 0, total: 0, ontime: 0 },
      afternoon: { done: 0, total: 0, ontime: 0 },
      evening: { done: 0, total: 0, ontime: 0 },
    };
    for (const task of all) {
      if (task.scheduledMinutes === null) continue;
      const bucket = bucketOf(task.scheduledMinutes);
      base[bucket].total += 1;
      if (task.done) {
        base[bucket].done += 1;
        if (task.punctuality === 'ontime') base[bucket].ontime += 1;
      }
    }
    return base;
  },

  /** Headline counts for the settings screen. */
  async totals(): Promise<{ habits: number; tasks: number; journals: number; days: number }> {
    const [habitCount, taskCount, journalCount, entryRows, journalRows] = await Promise.all([
      db.habits.count(),
      db.tasks.count(),
      db.journalEntries.count(),
      db.habitEntries.toArray(),
      db.journalEntries.toArray(),
    ]);
    const days = new Set<DateKey>();
    entryRows.forEach((e) => days.add(e.date));
    journalRows.forEach((j) => days.add(j.date));
    return { habits: habitCount, tasks: taskCount, journals: journalCount, days: days.size };
  },

  async habitTrend(
    habitId: number,
    days = 30,
    endDate: DateKey = todayKey()
  ): Promise<{ dates: DateKey[]; values: number[] }> {
    const dates = lastNDays(days, endDate);
    const values = await entries.series(habitId, dates);
    return { dates, values };
  },
};

/* ------------------------------------------------------------------ */
/* Backup, archive, seed                                               */
/* ------------------------------------------------------------------ */

const backup = {
  async exportJSON(): Promise<BackupFile> {
    const [habitRows, entryRows, taskRows, templateRows, journalRows, settingsRow] =
      await Promise.all([
        db.habits.toArray(),
        db.habitEntries.toArray(),
        db.tasks.toArray(),
        db.journalTemplates.toArray(),
        db.journalEntries.toArray(),
        db.settings.get('app'),
      ]);
    return {
      app: 'life-os',
      version: 1,
      exportedAt: now(),
      habits: habitRows,
      habitEntries: entryRows,
      tasks: taskRows,
      journalTemplates: templateRows,
      journalEntries: journalRows,
      settings: settingsRow ?? null,
    };
  },

  /** Replaces everything with the contents of a backup file. */
  async importJSON(file: BackupFile): Promise<void> {
    if (file.app !== 'life-os') throw new Error('That file was not exported from Life OS.');
    await db.transaction(
      'rw',
      db.habits,
      db.habitEntries,
      db.tasks,
      db.journalTemplates,
      db.journalEntries,
      db.settings,
      async () => {
        await Promise.all([
          db.habits.clear(),
          db.habitEntries.clear(),
          db.tasks.clear(),
          db.journalTemplates.clear(),
          db.journalEntries.clear(),
          db.settings.clear(),
        ]);
        await db.habits.bulkAdd(file.habits ?? []);
        await db.habitEntries.bulkAdd(file.habitEntries ?? []);
        await db.tasks.bulkAdd(file.tasks ?? []);
        await db.journalTemplates.bulkAdd(file.journalTemplates ?? []);
        await db.journalEntries.bulkAdd(file.journalEntries ?? []);
        if (file.settings) await db.settings.put(file.settings);
      }
    );
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      db.habits.clear(),
      db.habitEntries.clear(),
      db.tasks.clear(),
      db.journalTemplates.clear(),
      db.journalEntries.clear(),
    ]);
  },

  /** Everything the user ever wrote, grouped by day, as plain Markdown. */
  async exportMarkdown(): Promise<string> {
    const [habitRows, entryRows, taskRows, templateRows, journalRows] = await Promise.all([
      db.habits.toArray(),
      db.habitEntries.toArray(),
      db.tasks.toArray(),
      db.journalTemplates.toArray(),
      db.journalEntries.toArray(),
    ]);

    const habitById = new Map(habitRows.map((h) => [h.id!, h]));
    const templateById = new Map(templateRows.map((t) => [t.id!, t]));

    const days = new Set<DateKey>();
    entryRows.forEach((e) => days.add(e.date));
    taskRows.forEach((t) => days.add(t.date));
    journalRows.forEach((j) => days.add(j.date));
    const sorted = [...days].sort().reverse();

    const lines: string[] = [];
    lines.push('# Life OS archive');
    lines.push('');
    lines.push(`Exported ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push(
      `${habitRows.length} habits · ${taskRows.length} tasks · ${journalRows.length} journal entries · ${sorted.length} days recorded`
    );
    lines.push('');

    for (const date of sorted) {
      lines.push('---');
      lines.push('');
      lines.push(
        `## ${fromKey(date).toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      );
      lines.push('');

      const dayHabits = entryRows.filter((e) => e.date === date);
      if (dayHabits.length) {
        lines.push('### Habits');
        for (const entry of dayHabits) {
          const habit = habitById.get(entry.habitId);
          if (!habit) continue;
          if (habit.type === 'binary') {
            lines.push(`- ${habit.emoji} ${habit.name} — done`);
          } else if (habit.type === 'calculated') {
            lines.push(
              `- ${habit.emoji} ${habit.name} — ${entry.value}${habit.inputUnit} → ${entry.derived}${habit.outputUnit} of ${habit.target}${habit.outputUnit}`
            );
          } else {
            lines.push(
              `- ${habit.emoji} ${habit.name} — ${entry.value}${habit.unit ? ' ' + habit.unit : ''} of ${habit.target}`
            );
          }
        }
        lines.push('');
      }

      const dayTasks = taskRows
        .filter((t) => t.date === date)
        .sort((a, b) => (a.scheduledMinutes ?? 9999) - (b.scheduledMinutes ?? 9999));
      if (dayTasks.length) {
        lines.push('### Tasks');
        for (const task of dayTasks) {
          const box = task.done ? '[x]' : '[ ]';
          const time =
            task.scheduledMinutes === null
              ? ''
              : ` (${String(Math.floor(task.scheduledMinutes / 60)).padStart(2, '0')}:${String(
                  task.scheduledMinutes % 60
                ).padStart(2, '0')})`;
          let verdict = '';
          if (task.done && task.punctuality === 'late' && task.delayMinutes) {
            verdict = ` — ${task.delayMinutes} min late`;
          } else if (task.done && task.punctuality === 'ontime') {
            verdict = ' — on time';
          } else if (!task.done && date < toKey(new Date())) {
            verdict = ' — missed';
          }
          lines.push(`- ${box} ${task.title}${time}${verdict}`);
          if (task.notes) lines.push(`      ${task.notes}`);
        }
        lines.push('');
      }

      const dayJournal = journalRows.filter((j) => j.date === date);
      for (const entry of dayJournal) {
        const template = templateById.get(entry.templateId);
        lines.push(`### ${template?.name ?? 'Journal'}`);
        for (const pair of entry.pairs) {
          if (!pair.value.trim()) continue;
          lines.push(`**${pair.key}**`);
          lines.push('');
          lines.push(pair.value);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  },
};

/* ------------------------------------------------------------------ */
/* First run                                                           */
/* ------------------------------------------------------------------ */

/** Gives a brand-new install something to look at instead of five empty screens. */
async function seedIfEmpty(): Promise<void> {
  const count = await db.habits.count();
  const templateCount = await db.journalTemplates.count();
  if (count === 0) {
    await habits.create({
      name: 'Drink water',
      emoji: '💧',
      color: '#0A84FF',
      type: 'stepper',
      target: 8,
      step: 1,
      unit: 'glasses',
      order: 0,
    });
    await habits.create({
      name: 'Read',
      emoji: '📚',
      color: '#FF9F0A',
      type: 'binary',
      target: 1,
      order: 1,
    });
    await habits.create({
      name: 'Protein',
      emoji: '🍗',
      color: '#FF375F',
      type: 'calculated',
      target: 120,
      inputLabel: 'Chicken',
      inputUnit: 'g',
      outputLabel: 'Protein',
      outputUnit: 'g',
      factor: 0.31,
      order: 2,
    });
  }
  if (templateCount === 0) {
    await journal.createTemplate('Daily review', [
      'Win of the day',
      'What slowed me down',
      'One thing to carry forward',
    ]);
  }
}

export const DataService = {
  habits,
  entries,
  tasks,
  journal,
  settings: settingsApi,
  analytics,
  backup,
  seedIfEmpty,
};

export type DataServiceType = typeof DataService;
