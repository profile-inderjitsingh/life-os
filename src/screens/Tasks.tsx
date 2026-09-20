import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheckBig, Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskEditor } from '@/components/TaskEditor';
import { TaskRow } from '@/components/TaskRow';
import { EmptyState } from '@/components/ui/Card';
import { Pressable } from '@/components/ui/Pressable';
import { DataService } from '@/db/DataService';
import { cn } from '@/lib/cn';
import { humanDate } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/store/AppContext';
import type { Task } from '@/types';

export function Tasks() {
  const { date } = useApp();
  const tasks = useLiveQuery(() => DataService.tasks.forDate(date), [date]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const list = tasks ?? [];
  const scheduled = list.filter((t) => t.scheduledMinutes !== null);
  const anytime = list.filter((t) => t.scheduledMinutes === null);
  const done = list.filter((t) => t.done).length;
  const late = list.filter((t) => t.done && t.punctuality === 'late').length;

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const edit = (task: Task) => {
    setEditing(task);
    setEditorOpen(true);
  };

  const toggle = async (task: Task) => {
    const updated = await DataService.tasks.toggleDone(task.id!);
    if (updated?.done) haptic(updated.punctuality === 'late' ? 'warning' : 'success');
  };

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[15px] text-black/50 dark:text-white/45">
          {list.length
            ? `${done} of ${list.length} done${late ? ` · ${late} late` : ''}`
            : humanDate(date)}
        </p>
        <Pressable
          onClick={openNew}
          className="flex items-center gap-1 text-[15px] font-semibold text-ios-blue"
        >
          <Plus size={16} strokeWidth={2.8} />
          New
        </Pressable>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CircleCheckBig size={40} strokeWidth={1.5} />}
          title={`Nothing on ${humanDate(date).toLowerCase()}`}
          body="Give a task a time and Life OS records whether you actually hit it."
          action={
            <Pressable
              onClick={openNew}
              className="rounded-full bg-ios-blue px-5 py-2.5 text-[16px] font-semibold text-white"
            >
              Add a task
            </Pressable>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <Group title="Scheduled" tasks={scheduled} onToggle={toggle} onEdit={edit} />
          <Group title="Anytime" tasks={anytime} onToggle={toggle} onEdit={edit} />
        </div>
      )}

      <TaskEditor open={editorOpen} onOpenChange={setEditorOpen} task={editing} date={date} />
    </div>
  );
}

function Group({
  title,
  tasks,
  onToggle,
  onEdit,
}: {
  title: string;
  tasks: Task[];
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className={cn('mb-2 px-1 text-[13px] font-semibold text-black/45 dark:text-white/45')}>
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.li
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <TaskRow
                task={task}
                onToggle={() => onToggle(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => DataService.tasks.remove(task.id!)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
