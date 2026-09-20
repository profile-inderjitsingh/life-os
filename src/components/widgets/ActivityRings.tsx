import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface RingSpec {
  label: string;
  value: number; // 0..1, may exceed 1 conceptually but is clamped
  color: string;
  track: string;
  detail: string;
}

/**
 * Three concentric progress rings: habits on the outside, tasks in the middle,
 * journal at the core. Each sweeps from twelve o'clock like Apple's.
 */
export function ActivityRings({
  habits,
  tasks,
  journal,
  size = 168,
  stroke = 17,
  detail,
}: {
  habits: number;
  tasks: number;
  journal: number;
  size?: number;
  stroke?: number;
  detail?: { habits: string; tasks: string; journal: string };
}) {
  const rings: RingSpec[] = [
    {
      label: 'Habits',
      value: habits,
      color: '#FF375F',
      track: 'rgba(255,55,95,0.18)',
      detail: detail?.habits ?? '',
    },
    {
      label: 'Tasks',
      value: tasks,
      color: '#30D158',
      track: 'rgba(48,209,88,0.18)',
      detail: detail?.tasks ?? '',
    },
    {
      label: 'Journal',
      value: journal,
      color: '#0A84FF',
      track: 'rgba(10,132,255,0.18)',
      detail: detail?.journal ?? '',
    },
  ];

  const center = size / 2;
  const gap = 5;

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
        role="img"
        aria-label={`Habits ${Math.round(habits * 100)} percent, tasks ${Math.round(
          tasks * 100
        )} percent, journal ${Math.round(journal * 100)} percent`}
      >
        {rings.map((ring, index) => {
          const radius = center - stroke / 2 - index * (stroke + gap);
          const circumference = 2 * Math.PI * radius;
          const progress = Math.max(0, Math.min(1, ring.value));
          return (
            <g key={ring.label}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.track}
                strokeWidth={stroke}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={false}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ type: 'spring', stiffness: 90, damping: 20, delay: index * 0.06 }}
              />
            </g>
          );
        })}
      </svg>

      <ul className="flex min-w-0 flex-col gap-3">
        {rings.map((ring) => (
          <li key={ring.label} className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-[13px] font-medium text-black/50 dark:text-white/50">
                {ring.label}
              </span>
            </div>
            <p className="text-[21px] font-bold leading-tight tabular-nums">
              {Math.round(Math.min(1, ring.value) * 100)}
              <span className="text-[14px] font-semibold text-black/35 dark:text-white/35">%</span>
            </p>
            <p className={cn('truncate text-[12px] text-black/40 dark:text-white/40')}>
              {ring.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
