import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { haptic, spring } from '@/lib/haptics';

export interface SwipeAction {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  tone: 'destructive' | 'neutral' | 'accent';
}

const TONES: Record<SwipeAction['tone'], string> = {
  destructive: 'bg-[#FF3B30] text-white',
  neutral: 'bg-[#8E8E93] text-white',
  accent: 'bg-ios-blue text-white',
};

const ACTION_WIDTH = 78;

/**
 * Drag left to reveal actions. Past two-thirds of the way the row commits to the
 * first action on release, which is how Mail behaves and what thumbs expect.
 */
export function SwipeRow({
  actions,
  children,
  className,
  disabled,
}: {
  actions: SwipeAction[];
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const armed = useRef(false);
  const trayWidth = actions.length * ACTION_WIDTH;
  const commitAt = trayWidth + 64;

  useEffect(() => {
    if (disabled) void controls.start({ x: 0, transition: spring.snappy });
  }, [disabled, controls]);

  const close = () => {
    setOpen(false);
    void controls.start({ x: 0, transition: spring.snappy });
  };

  if (disabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-card', className)}>
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              haptic(action.tone === 'destructive' ? 'warning' : 'medium');
              close();
              action.onSelect();
            }}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium',
              TONES[action.tone]
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <motion.div
        drag="x"
        style={{ x }}
        animate={controls}
        dragDirectionLock
        dragConstraints={{ left: -commitAt, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        onDrag={(_, info) => {
          const past = info.offset.x < -commitAt + 10;
          if (past && !armed.current) {
            armed.current = true;
            haptic('medium');
          } else if (!past) {
            armed.current = false;
          }
        }}
        onDragEnd={(_, info) => {
          const shouldCommit = info.offset.x < -commitAt + 10;
          const shouldOpen = info.offset.x < -ACTION_WIDTH / 2 || info.velocity.x < -450;
          armed.current = false;

          if (shouldCommit) {
            haptic('warning');
            void controls.start({ x: -window.innerWidth, transition: { duration: 0.18 } });
            setTimeout(() => actions[0].onSelect(), 150);
            return;
          }
          if (shouldOpen) {
            setOpen(true);
            void controls.start({ x: -trayWidth, transition: spring.snappy });
          } else {
            close();
          }
        }}
        onClickCapture={(event) => {
          // A tap while the tray is open should shut it, not fire the row.
          if (open) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
