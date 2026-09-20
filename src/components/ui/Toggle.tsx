import * as Switch from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

/** The green iOS switch, down to the 31px travel and the spring-free glide. */
export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Switch.Root
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onCheckedChange={(value) => {
        haptic('light');
        onCheckedChange(value);
      }}
      className={cn(
        'relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ease-ios',
        'disabled:opacity-40',
        checked ? 'bg-[#34C759]' : 'bg-black/15 dark:bg-white/20'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block h-[27px] w-[27px] translate-x-[2px] rounded-full bg-white',
          'shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-ios',
          'data-[state=checked]:translate-x-[22px]'
        )}
      />
    </Switch.Root>
  );
}
