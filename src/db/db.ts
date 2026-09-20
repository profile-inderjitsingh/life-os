import Dexie, { type Table } from 'dexie';
import type {
  Habit,
  HabitEntry,
  JournalEntry,
  JournalTemplate,
  Settings,
  Task,
} from '@/types';

/**
 * The only file in the app that knows Dexie exists, besides DataService.
 * UI code must go through DataService — never import `db` from a component.
 */
export class LifeOSDatabase extends Dexie {
  habits!: Table<Habit, number>;
  habitEntries!: Table<HabitEntry, number>;
  tasks!: Table<Task, number>;
  journalTemplates!: Table<JournalTemplate, number>;
  journalEntries!: Table<JournalEntry, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super('life-os');

    this.version(1).stores({
      habits: '++id, order, archived, createdAt',
      habitEntries: '++id, habitId, date, [habitId+date]',
      tasks: '++id, date, done, order, [date+done]',
      journalTemplates: '++id, order',
      journalEntries: '++id, templateId, date, [templateId+date]',
      settings: 'id',
    });
  }
}

export const db = new LifeOSDatabase();
