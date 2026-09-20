import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/haptics';
import { Pressable } from './Pressable';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Right-hand action in the sheet header, e.g. "Save". */
  action?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
  /** Tall sheets get their own scroll area; short ones hug their content. */
  fullHeight?: boolean;
}

/**
 * Slides up from the bottom, dims what is behind it, and can be flung away with
 * a downward drag — the interaction iOS users already have in their fingers.
 */
export function Sheet({ open, onOpenChange, title, action, children, fullHeight }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={spring.sheet}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 120 || info.velocity.y > 700) onOpenChange(false);
                }}
                className={cn(
                  'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-sheet shadow-sheet',
                  'border-t border-white/40 dark:border-white/10',
                  'bg-white/80 backdrop-blur-xl dark:bg-[#1C1C1E]/80',
                  fullHeight ? 'h-[88vh]' : 'max-h-[88vh]'
                )}
              >
                <div className="flex shrink-0 cursor-grab justify-center pb-1 pt-2 active:cursor-grabbing">
                  <div className="h-1.5 w-10 rounded-full bg-black/20 dark:bg-white/25" />
                </div>

                {(title || action) && (
                  <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-1">
                    <Dialog.Close asChild>
                      <Pressable className="min-w-16 text-left text-[17px] text-ios-blue">
                        Cancel
                      </Pressable>
                    </Dialog.Close>
                    <Dialog.Title className="text-[17px] font-semibold tracking-tight">
                      {title}
                    </Dialog.Title>
                    {action ? (
                      <Pressable
                        onClick={action.onClick}
                        disabled={action.disabled}
                        feedback="success"
                        className={cn(
                          'min-w-16 text-right text-[17px] font-semibold',
                          action.disabled ? 'text-black/25 dark:text-white/25' : 'text-ios-blue'
                        )}
                      >
                        {action.label}
                      </Pressable>
                    ) : (
                      <span className="min-w-16" />
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'ios-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))]',
                    !title && !action && 'pt-2'
                  )}
                >
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
