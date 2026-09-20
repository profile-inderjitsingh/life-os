import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { haptic, spring } from '@/lib/haptics';

type Props = HTMLMotionProps<'button'> & {
  /** How far the control shrinks under a finger. Big surfaces move less. */
  squish?: number;
  feedback?: 'light' | 'medium' | 'success' | 'warning' | 'none';
};

/**
 * Every tappable surface in the app. The scale-down on press is what sells the
 * "native" feel more than any other single detail.
 */
export const Pressable = forwardRef<HTMLButtonElement, Props>(function Pressable(
  { squish = 0.94, feedback = 'light', className, onTapStart, children, ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: squish }}
      transition={spring.snappy}
      onTapStart={(event, info) => {
        if (feedback !== 'none') haptic(feedback);
        onTapStart?.(event, info);
      }}
      className={cn('select-none outline-none focus-visible:ring-2 focus-visible:ring-ios-blue', className)}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
