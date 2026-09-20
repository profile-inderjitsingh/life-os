import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Pressable } from './Pressable';

/** The segmented −/+ control from iOS, used for counting habits. */
export function Stepper({
  onDecrement,
  onIncrement,
  canDecrement = true,
  size = 'md',
}: {
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  size?: 'sm' | 'md';
}) {
  const box = size === 'sm' ? 'h-8 w-9' : 'h-9 w-11';
  const icon = size === 'sm' ? 16 : 18;

  return (
    <div className="flex items-stretch overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.14]">
      <Pressable
        onClick={onDecrement}
        disabled={!canDecrement}
        squish={0.88}
        aria-label="Decrease"
        className={cn('grid place-items-center', box, !canDecrement && 'opacity-30')}
      >
        <Minus size={icon} strokeWidth={2.6} />
      </Pressable>
      <span className="my-2 w-px bg-black/10 dark:bg-white/15" />
      <Pressable
        onClick={onIncrement}
        squish={0.88}
        aria-label="Increase"
        className={cn('grid place-items-center', box)}
      >
        <Plus size={icon} strokeWidth={2.6} />
      </Pressable>
    </div>
  );
}
