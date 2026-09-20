import { motion } from 'framer-motion';
import { useId } from 'react';
import { fromKey } from '@/lib/date';
import { formatNumber } from '@/lib/habits';
import type { DateKey } from '@/types';

const W = 320;
const H = 120;
const PAD = 8;

/** Catmull-Rom through every point, converted to cubic béziers. */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(
      2
    )} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function HabitTrend({
  dates,
  values,
  color,
  unit,
  target,
}: {
  dates: DateKey[];
  values: number[];
  color: string;
  unit: string;
  target?: number;
}) {
  const gradientId = useId();
  const max = Math.max(target ?? 0, ...values, 1);
  const points = values.map((value, i) => ({
    x: PAD + (i * (W - PAD * 2)) / Math.max(1, values.length - 1),
    y: H - PAD - (value / max) * (H - PAD * 2),
  }));

  const line = smoothPath(points);
  const area = line
    ? `${line} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`
    : '';

  const total = values.reduce((sum, v) => sum + v, 0);
  const active = values.filter((v) => v > 0).length;
  const average = active ? total / active : 0;
  const targetY = target ? H - PAD - (target / max) * (H - PAD * 2) : null;

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-4">
        <span className="text-[13px] text-black/45 dark:text-white/45">
          Average{' '}
          <strong className="text-[15px] font-semibold text-black dark:text-white tabular-nums">
            {formatNumber(average)}
            {unit && ` ${unit}`}
          </strong>
        </span>
        <span className="text-[13px] text-black/45 dark:text-white/45">
          Logged{' '}
          <strong className="text-[15px] font-semibold text-black dark:text-white tabular-nums">
            {active}
          </strong>{' '}
          days
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img"
        aria-label={`Trend over the last ${values.length} days`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {targetY !== null && (
          <line
            x1={0}
            y1={targetY}
            x2={W}
            y2={targetY}
            stroke={color}
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
        )}

        <path d={area} fill={`url(#${gradientId})`} />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          vectorEffect="non-scaling-stroke"
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3.5"
            fill={color}
          />
        )}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-black/35 dark:text-white/35">
        <span>{label(dates[0])}</span>
        <span>{label(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
}

function label(key?: DateKey): string {
  if (!key) return '';
  return fromKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
