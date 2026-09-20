import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, Pencil, Trash2 } from 'lucide-react';
import { Pressable } from '@/components/ui/Pressable';
import { SwipeRow } from '@/components/ui/SwipeRow';
import { cn } from '@/lib/cn';
import { formatDuration, formatMinutes, isPast } from '@/lib/date';
import type { Task } from '@/types';

/** The sentence under a finished task — the point of the punctuality engine. */
function verdict(task: Task): { text: string; tone: string } | null {
  if (!task.done) {
    if (task.scheduledMinutes !== null && isPast(task.date)) {
      return { text: 'Missed', tone: 'text-[#FF453A]' };
    }
    return null;
  }
  if (task.punctuality === 'late' && task.delayMinutes) {
    return { text: `Done ${formatDuration(task.delayMinutes)} late`, tone: 'text-[#FF9F0A]' };
  }
  if (task.punctuality === 'ontime') {
    const early = task.delayMinutes !== null && task.delayMinutes < -5;
    return {
      text: early ? `Done ${formatDuration(task.delayMinutes!)} early` : 'On time',
      tone: 'text-[#30D158]',
    };
  }
  return { text: 'Done', tone: 'text-black/35 dark:text-white/35' };
}

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = verdict(task);

  return (
    <SwipeRow
      actions={[
        { label: 'Delete', icon: <Trash2 size={19} />, onSelect: onDelete, tone: 'destructive' },
        { label: 'Edit', icon: <Pencil size={19} />, onSelect: onEdit, tone: 'neutral' },
      ]}
    >
      <div className="flex items-start gap-3 bg-white p-4 dark:bg-[#1C1C1E]">
        <Pressable
          onClick={onToggle}
          feedback={task.done ? 'light' : 'success'}
          squish={0.85}
          aria-label={task.done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          className={cn(
            'mt-0.5 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 transition-colors',
            task.done
              ? 'border-transparent bg-ios-blue text-white'
              : 'border-black/20 dark:border-white/30'
          )}
        >
          <AnimatePresence>
            {task.done && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 25 }}
              >
                <Check size={15} strokeWidth={3.4} />
              </motion.span>
            )}
          </AnimatePresence>
        </Pressable>

        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p
            className={cn(
              'text-[17px] leading-snug',
              task.done === 1 && 'text-black/35 line-through dark:text-white/35'
            )}
          >
            {task.title}
          </p>

          {task.notes && (
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-black/45 dark:text-white/45">
              {task.notes}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {task.scheduledMinutes !== null && (
              <span className="flex items-center gap-1 text-[13px] tabular-nums text-black/45 dark:text-white/45">
                <Clock3 size={13} />
                {formatMinutes(task.scheduledMinutes)}
              </span>
            )}
            {status && (
              <span className={cn('text-[13px] font-medium', status.tone)}>{status.text}</span>
            )}
            {task.scheduledMinutes === null && !task.done && (
              <span className="text-[13px] text-black/35 dark:text-white/35">Anytime</span>
            )}
          </div>
        </button>
      </div>
    </SwipeRow>
  );
}
