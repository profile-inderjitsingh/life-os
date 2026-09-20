/**
 * Visual haptics are done in Framer Motion; this adds the real thing where the
 * browser allows it. iOS Safari ignores vibrate(), so the animation carries the
 * feel on iPhone and this is a bonus on Android.
 */
type Strength = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<Strength, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 40, 18],
  warning: [24, 60, 24],
};

export function haptic(strength: Strength = 'light'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[strength]);
  } catch {
    /* Vibration is a nicety — never let it break an interaction. */
  }
}

/** Spring presets tuned to feel like UIKit rather than a web page. */
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  gentle: { type: 'spring', stiffness: 260, damping: 28 },
  sheet: { type: 'spring', stiffness: 340, damping: 36, mass: 0.9 },
} as const;
