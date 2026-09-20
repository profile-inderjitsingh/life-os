import { motion } from 'framer-motion';
import { BUCKET_LABEL, type TimeBucket } from '@/lib/date';

type Buckets = Record<TimeBucket, { done: number; total: number; ontime: number }>;

const ORDER: TimeBucket[] = ['morning', 'afternoon', 'evening'];
const COLORS: Record<TimeBucket, string> = {
  morning: '#FF9F0A',
  afternoon: '#0A84FF',
  evening: '#5E5CE6',
};

/** Where the day actually holds together, and where it falls apart. */
export function TimeOfDayChart({ buckets }: { buckets: Buckets }) {
  const hasData = ORDER.some((b) => buckets[b].total > 0);
  const best = ORDER.filter((b) => buckets[b].total > 0).sort(
    (a, b) => rate(buckets[b]) - rate(buckets[a])
  )[0];

  if (!hasData) {
    return (
      <p className="py-6 text-center text-[15px] text-black/40 dark:text-white/40">
        Schedule a few tasks and this fills in.
      </p>
    );
  }

  return (
    <div>
      <div className="flex h-[132px] items-end gap-4">
        {ORDER.map((bucket, index) => {
          const stats = buckets[bucket];
          const pct = rate(stats);
          return (
            <div key={bucket} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[13px] font-semibold tabular-nums">
                {stats.total ? `${Math.round(pct * 100)}%` : '—'}
              </span>
              <div className="relative flex h-[88px] w-full items-end overflow-hidden rounded-xl bg-black/[0.05] dark:bg-white/[0.07]">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct * 100, stats.total ? 4 : 0)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: index * 0.05 }}
                  className="w-full rounded-xl"
                  style={{ backgroundColor: COLORS[bucket] }}
                />
              </div>
              <span className="text-[12px] font-medium text-black/50 dark:text-white/50">
                {BUCKET_LABEL[bucket]}
              </span>
              <span className="text-[11px] text-black/35 dark:text-white/35 tabular-nums">
                {stats.done}/{stats.total}
              </span>
            </div>
          );
        })}
      </div>

      {best && buckets[best].total > 1 && (
        <p className="mt-3 text-[13px] text-black/50 dark:text-white/50">
          {BUCKET_LABEL[best].toLowerCase()} is your strongest stretch — put the work that matters there.
        </p>
      )}
    </div>
  );
}

function rate(stats: { done: number; total: number }): number {
  return stats.total ? stats.done / stats.total : 0;
}
