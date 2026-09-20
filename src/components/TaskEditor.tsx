import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FieldLabel, TextArea, TextField } from '@/components/ui/Field';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/ui/Sheet';
import { TimeWheel } from '@/components/ui/TimeWheel';
import { Toggle } from '@/components/ui/Toggle';
import { DataService } from '@/db/DataService';
import { formatMinutes, humanDate, minutesNow } from '@/lib/date';
import { spring } from '@/lib/haptics';
import type { DateKey, Task } from '@/types';

export function TaskEditor({
  open,
  onOpenChange,
  task,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  date: DateKey;
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduled, setScheduled] = useState(true);
  const [minutes, setMinutes] = useState(9 * 60);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setScheduled(task ? task.scheduledMinutes !== null : true);
    setMinutes(task?.scheduledMinutes ?? roundToFive(minutesNow() + 60));
  }, [open, task]);

  const save = async () => {
    const payload = {
      title: title.trim(),
      notes: notes.trim(),
      scheduledMinutes: scheduled ? minutes : null,
    };
    if (!payload.title) return;
    if (task?.id) await DataService.tasks.update(task.id, payload);
    else await DataService.tasks.create({ ...payload, date });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={task ? 'Edit task' : 'New task'}
      action={{ label: task ? 'Save' : 'Add', onClick: save, disabled: !title.trim() }}
    >
      <div className="flex flex-col gap-4 pb-4">
        <div>
          <TextField
            value={title}
            autoFocus={!task}
            placeholder="What needs doing?"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <FieldLabel>Notes</FieldLabel>
          <TextArea
            rows={2}
            value={notes}
            placeholder="Optional detail"
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="rounded-card bg-white px-4 dark:bg-[#1C1C1E]">
          <div className="flex min-h-[52px] items-center justify-between">
            <div>
              <p className="text-[17px]">Give it a time</p>
              <p className="text-[13px] text-black/45 dark:text-white/45">
                {scheduled
                  ? `${formatMinutes(minutes)} on ${humanDate(date)}`
                  : 'Anytime — no punctuality check'}
              </p>
            </div>
            <Toggle checked={scheduled} onCheckedChange={setScheduled} label="Give it a time" />
          </div>

          <AnimatePresence initial={false}>
            {scheduled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring.gentle}
                className="overflow-hidden"
              >
                <div className="border-t border-black/[0.07] pb-2 pt-1 dark:border-white/[0.08]">
                  <TimeWheel minutes={minutes} onChange={setMinutes} />
                  <div className="flex gap-2 pb-2">
                    {[
                      { label: 'Now', value: roundToFive(minutesNow()) },
                      { label: '9:00 AM', value: 9 * 60 },
                      { label: '1:00 PM', value: 13 * 60 },
                      { label: '7:00 PM', value: 19 * 60 },
                    ].map((preset) => (
                      <Pressable
                        key={preset.label}
                        onClick={() => setMinutes(preset.value)}
                        className="flex-1 rounded-xl bg-black/[0.05] py-2 text-[13px] font-medium text-ios-blue dark:bg-white/[0.08]"
                      >
                        {preset.label}
                      </Pressable>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {task?.id && (
          <Pressable
            onClick={async () => {
              await DataService.tasks.remove(task.id!);
              onOpenChange(false);
            }}
            feedback="warning"
            className="rounded-2xl bg-[#FF453A]/10 py-3 text-[17px] font-semibold text-[#FF453A]"
          >
            Delete task
          </Pressable>
        )}
      </div>
    </Sheet>
  );
}

function roundToFive(minutes: number): number {
  return Math.min(23 * 60 + 55, Math.round(minutes / 5) * 5);
}
