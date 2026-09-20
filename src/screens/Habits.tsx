import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Repeat2 } from 'lucide-react';
import { useState } from 'react';
import { HabitEditor } from '@/components/HabitEditor';
import { HabitLogSheet } from '@/components/HabitLogSheet';
import { HabitRow } from '@/components/HabitRow';
import { EmptyState } from '@/components/ui/Card';
import { Pressable } from '@/components/ui/Pressable';
import { DataService } from '@/db/DataService';
import { humanDate, isFuture } from '@/lib/date';
import { habitProgress } from '@/lib/habits';
import { useApp } from '@/store/AppContext';
import type { Habit } from '@/types';

export function Habits() {
  const { date } = useApp();
  const habits = useLiveQuery(() => DataService.habits.list(), []);
  const entries = useLiveQuery(() => DataService.entries.forDate(date), [date]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logging, setLogging] = useState<Habit | null>(null);

  const entryFor = (habitId: number) => entries?.find((e) => e.habitId === habitId);
  const completed = (habits ?? []).filter((h) => habitProgress(h, entryFor(h.id!)) >= 1).length;

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[15px] text-black/50 dark:text-white/45">
          {habits?.length
            ? `${completed} of ${habits.length} done · ${humanDate(date)}`
            : 'Nothing tracked yet'}
        </p>
        <Pressable
          onClick={openNew}
          className="flex items-center gap-1 text-[15px] font-semibold text-ios-blue"
        >
          <Plus size={16} strokeWidth={2.8} />
          New
        </Pressable>
      </div>

      {isFuture(date) && (
        <p className="mb-3 rounded-2xl bg-ios-orange/12 px-4 py-2.5 text-[13px] text-ios-orange">
          This day has not happened yet. Anything you log here is a plan, not a record.
        </p>
      )}

      {habits && habits.length === 0 ? (
        <EmptyState
          icon={<Repeat2 size={40} strokeWidth={1.5} />}
          title="No habits yet"
          body="Track anything you repeat: a tick, a count, or a number that converts into something else."
          action={
            <Pressable
              onClick={openNew}
              className="rounded-full bg-ios-blue px-5 py-2.5 text-[16px] font-semibold text-white"
            >
              Create your first habit
            </Pressable>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {(habits ?? []).map((habit) => (
              <motion.li
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              >
                <HabitRow
                  habit={habit}
                  entry={entryFor(habit.id!)}
                  onToggle={() => DataService.entries.toggle(habit, date)}
                  onStep={(direction) => DataService.entries.step(habit, date, direction)}
                  onOpenInput={() => {
                    setLogging(habit);
                    setLogOpen(true);
                  }}
                  onEdit={() => {
                    setEditing(habit);
                    setEditorOpen(true);
                  }}
                  onDelete={() => DataService.habits.remove(habit.id!)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <HabitEditor open={editorOpen} onOpenChange={setEditorOpen} habit={editing} />
      <HabitLogSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        habit={logging}
        entry={logging ? entryFor(logging.id!) : undefined}
        date={date}
      />
    </div>
  );
}
