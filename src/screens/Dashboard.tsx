import { AnimatePresence, Reorder, motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronRight, Eye, EyeOff, GripVertical, Pencil, Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { HabitTrend } from '@/components/widgets/HabitTrend';
import { ActivityRings } from '@/components/widgets/ActivityRings';
import { PunctualityHeatmap } from '@/components/widgets/PunctualityHeatmap';
import { StreakRail } from '@/components/widgets/StreakRail';
import { TimeOfDayChart } from '@/components/widgets/TimeOfDayChart';
import { Card } from '@/components/ui/Card';
import { Pressable } from '@/components/ui/Pressable';
import { DataService } from '@/db/DataService';
import { cn } from '@/lib/cn';
import { daysInMonth, endOfMonth, fromKey, humanDate, startOfMonth, toKey } from '@/lib/date';
import { achievedUnit } from '@/lib/habits';
import type { Route } from '@/lib/router';
import { useApp } from '@/store/AppContext';
import type { WidgetId, WidgetPref } from '@/types';

const WIDGET_TITLES: Record<WidgetId, string> = {
  rings: 'Your day at a glance',
  streaks: 'Streaks',
  tasks: 'Tasks',
  habits: 'Habits',
  heatmap: 'Punctuality',
  timeOfDay: 'When you deliver',
  trends: 'Habit trend',
};

export function Dashboard({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { date, settings, setDate } = useApp();
  const [editing, setEditing] = useState(false);

  const stats = useLiveQuery(() => DataService.analytics.dayStats(date), [date]);
  const streaks = useLiveQuery(() => DataService.analytics.allStreaks(date), [date]);
  const habits = useLiveQuery(() => DataService.habits.list(), []);
  const tasks = useLiveQuery(() => DataService.tasks.forDate(date), [date]);

  const monthBounds = useMemo(() => {
    const d = fromKey(date);
    return { from: toKey(startOfMonth(d)), to: toKey(endOfMonth(d)), days: daysInMonth(d) };
  }, [date]);

  const punctuality = useLiveQuery(
    () => DataService.analytics.punctualityRange(monthBounds.from, monthBounds.to),
    [monthBounds.from, monthBounds.to]
  );
  const buckets = useLiveQuery(() => DataService.analytics.timeOfDay(30, date), [date]);

  const quantitative = useMemo(
    () => (habits ?? []).filter((h) => h.type !== 'binary'),
    [habits]
  );
  const trendHabit =
    quantitative.find((h) => h.id === settings?.trendHabitId) ?? quantitative[0] ?? null;

  const trend = useLiveQuery(
    () => (trendHabit ? DataService.analytics.habitTrend(trendHabit.id!, 30, date) : undefined),
    [trendHabit?.id, date]
  );

  const widgets = settings?.widgets ?? [];
  const visible = widgets.filter((w) => w.visible);

  const move = async (next: WidgetPref[]) => {
    await DataService.settings.setWidgets(next);
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'rings':
        return (
          <Card key={id}>
            <ActivityRings
              habits={stats?.habits ?? 0}
              tasks={stats?.tasks ?? 0}
              journal={stats?.journal ?? 0}
              detail={{
                habits: `${stats?.habitsDone ?? 0} of ${stats?.habitsTotal ?? 0} complete`,
                tasks: `${stats?.tasksDone ?? 0} of ${stats?.tasksTotal ?? 0} done`,
                journal: `${stats?.journalDone ?? 0} of ${stats?.journalTotal ?? 0} written`,
              }}
            />
          </Card>
        );

      case 'streaks':
        return (
          <WidgetCard key={id} title={WIDGET_TITLES.streaks}>
            <StreakRail streaks={streaks ?? []} />
          </WidgetCard>
        );

      case 'tasks':
        return (
          <WidgetCard
            key={id}
            title={`Tasks · ${humanDate(date)}`}
            onOpen={() => onNavigate('tasks')}
          >
            {tasks && tasks.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {tasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2',
                        task.done
                          ? 'border-transparent bg-ios-blue text-white'
                          : 'border-black/20 dark:border-white/25'
                      )}
                    >
                      {task.done && <Check size={13} strokeWidth={3.4} />}
                    </span>
                    <span
                      className={cn(
                        'flex-1 truncate text-[15px]',
                        task.done === 1 && 'text-black/35 line-through dark:text-white/35'
                      )}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
                {tasks.length > 4 && (
                  <li className="pl-8 text-[13px] text-black/40 dark:text-white/40">
                    and {tasks.length - 4} more
                  </li>
                )}
              </ul>
            ) : (
              <EmptyLine
                text="Nothing scheduled."
                cta="Add a task"
                onClick={() => onNavigate('tasks')}
              />
            )}
          </WidgetCard>
        );

      case 'habits':
        return (
          <WidgetCard key={id} title="Habits" onOpen={() => onNavigate('habits')}>
            {habits && habits.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {habits.slice(0, 5).map((habit) => (
                  <HabitPulse key={habit.id} habitId={habit.id!} date={date} />
                ))}
              </div>
            ) : (
              <EmptyLine
                text="No habits yet."
                cta="Create one"
                onClick={() => onNavigate('habits')}
              />
            )}
          </WidgetCard>
        );

      case 'heatmap':
        return (
          <WidgetCard key={id} title={WIDGET_TITLES.heatmap}>
            <PunctualityHeatmap
              days={monthBounds.days}
              data={punctuality ?? new Map()}
              onSelectDay={setDate}
            />
          </WidgetCard>
        );

      case 'timeOfDay':
        return (
          <WidgetCard key={id} title={WIDGET_TITLES.timeOfDay} subtitle="Last 30 days">
            <TimeOfDayChart
              buckets={
                buckets ?? {
                  morning: { done: 0, total: 0, ontime: 0 },
                  afternoon: { done: 0, total: 0, ontime: 0 },
                  evening: { done: 0, total: 0, ontime: 0 },
                }
              }
            />
          </WidgetCard>
        );

      case 'trends':
        return (
          <WidgetCard
            key={id}
            title={trendHabit ? `${trendHabit.emoji} ${trendHabit.name}` : WIDGET_TITLES.trends}
            subtitle="Last 30 days"
            action={
              quantitative.length > 1 ? (
                <select
                  value={trendHabit?.id ?? ''}
                  onChange={(e) =>
                    DataService.settings.save({ trendHabitId: Number(e.target.value) })
                  }
                  className="max-w-[120px] truncate rounded-lg bg-black/[0.05] px-2 py-1 text-[13px] text-ios-blue dark:bg-white/[0.08]"
                >
                  {quantitative.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          >
            {trendHabit && trend ? (
              <HabitTrend
                dates={trend.dates}
                values={trend.values}
                color={trendHabit.color}
                unit={achievedUnit(trendHabit)}
                target={trendHabit.target}
              />
            ) : (
              <EmptyLine
                text="Counting and converting habits chart here."
                cta="Add one"
                onClick={() => onNavigate('habits')}
              />
            )}
          </WidgetCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-4">
      <div className="flex justify-end">
        <Pressable
          onClick={() => setEditing((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[14px] font-semibold',
            editing ? 'bg-ios-blue text-white' : 'bg-black/[0.06] text-ios-blue dark:bg-white/[0.10]'
          )}
        >
          {editing ? <Check size={15} strokeWidth={2.8} /> : <Pencil size={14} strokeWidth={2.6} />}
          {editing ? 'Done' : 'Edit'}
        </Pressable>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <p className="mb-2 px-1 text-[13px] text-black/45 dark:text-white/45">
              Drag to reorder. Tap the eye to hide a card.
            </p>
            <Reorder.Group axis="y" values={widgets} onReorder={move} className="flex flex-col gap-2">
              {widgets.map((widget) => (
                <Reorder.Item
                  key={widget.id}
                  value={widget}
                  whileDrag={{ scale: 1.03, zIndex: 10 }}
                  className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-card dark:bg-[#1C1C1E] dark:shadow-none"
                >
                  <GripVertical size={18} className="text-black/25 dark:text-white/25" />
                  <span
                    className={cn(
                      'flex-1 text-[17px]',
                      !widget.visible && 'text-black/35 dark:text-white/35'
                    )}
                  >
                    {WIDGET_TITLES[widget.id]}
                  </span>
                  <Pressable
                    onClick={() => DataService.settings.toggleWidget(widget.id)}
                    aria-label={widget.visible ? 'Hide card' : 'Show card'}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full',
                      widget.visible
                        ? 'text-ios-blue'
                        : 'bg-black/[0.05] text-black/30 dark:bg-white/[0.08] dark:text-white/30'
                    )}
                  >
                    {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </Pressable>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        ) : (
          <motion.div
            key="widgets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3.5"
          >
            {visible.map((widget) => renderWidget(widget.id))}
            {visible.length === 0 && (
              <Card className="py-10 text-center text-[15px] text-black/45 dark:text-white/45">
                Every card is hidden. Tap Edit to bring some back.
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WidgetCard({
  title,
  subtitle,
  children,
  onOpen,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onOpen?: () => void;
  action?: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[12px] text-black/40 dark:text-white/40">{subtitle}</p>
          )}
        </div>
        {action}
        {onOpen && (
          <Pressable
            onClick={onOpen}
            aria-label={`Open ${title}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black/30 dark:text-white/30"
          >
            <ChevronRight size={20} />
          </Pressable>
        )}
      </div>
      {children}
    </Card>
  );
}

function EmptyLine({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[15px] text-black/40 dark:text-white/40">{text}</span>
      <Pressable
        onClick={onClick}
        className="flex items-center gap-1 text-[15px] font-medium text-ios-blue"
      >
        <Plus size={15} strokeWidth={2.8} />
        {cta}
      </Pressable>
    </div>
  );
}

/** One compact progress line per habit, live-bound to its entry for the day. */
function HabitPulse({ habitId, date }: { habitId: number; date: string }) {
  const habit = useLiveQuery(() => DataService.habits.get(habitId), [habitId]);
  const entry = useLiveQuery(() => DataService.entries.get(habitId, date), [habitId, date]);
  if (!habit) return null;

  const progress =
    habit.type === 'binary'
      ? (entry?.value ?? 0) >= 1
        ? 1
        : 0
      : Math.min(
          1,
          (habit.type === 'calculated' ? (entry?.derived ?? 0) : (entry?.value ?? 0)) /
            (habit.target || 1)
        );

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 shrink-0 text-center text-[16px]">{habit.emoji}</span>
      <span className="w-[86px] shrink-0 truncate text-[14px]">{habit.name}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.10]">
        <motion.div
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="h-full rounded-full"
          style={{ backgroundColor: habit.color }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-black/40 dark:text-white/40">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
