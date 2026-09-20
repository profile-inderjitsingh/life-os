import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-2xl bg-black/[0.05] px-4 py-3 text-[17px] placeholder:text-black/30 ' +
  'outline-none focus:ring-2 focus:ring-ios-blue/60 dark:bg-white/[0.08] dark:placeholder:text-white/30';

export function TextField({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'resize-none leading-snug', className)} {...rest} />;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block px-1 text-[13px] font-medium text-black/50 dark:text-white/45">
      {children}
    </span>
  );
}

/** Grouped inset row, as used in iOS Settings. */
export function Row({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex min-h-[52px] items-center gap-3 px-4',
        onClick && 'cursor-pointer active:bg-black/[0.04] dark:active:bg-white/[0.06]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function RowGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-card bg-white shadow-card dark:bg-[#1C1C1E] dark:shadow-none',
        '[&>*+*]:border-t [&>*+*]:border-black/[0.07] dark:[&>*+*]:border-white/[0.08]',
        className
      )}
    >
      {children}
    </div>
  );
}
