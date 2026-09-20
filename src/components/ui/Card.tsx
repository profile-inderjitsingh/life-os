import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Edge-to-edge grouped card, the base surface for every screen. */
export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-card bg-white shadow-card dark:bg-[#1C1C1E] dark:shadow-none',
        padded && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-end justify-between px-1">
      <h2 className="text-[22px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card px-6 py-12 text-center">
      <div className="mb-1 text-black/25 dark:text-white/25">{icon}</div>
      <p className="text-[17px] font-semibold">{title}</p>
      <p className="max-w-[26ch] text-[15px] leading-snug text-black/50 dark:text-white/45">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
