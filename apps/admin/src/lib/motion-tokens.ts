/**
 * Central Motion Tokens & Utilities — IOMA Paris Dubai (Sprint 4.6)
 *
 * Single source of truth for motion durations, easings, variants, and reduced-motion fallbacks.
 * Preserves restrained luxury motion aesthetic: precise, calm, responsive, never distracting.
 */

export const MOTION_DURATIONS = {
  instant: 0.12, // 120ms — Instant feedback (buttons, toggles)
  control: 0.18, // 180ms — Small controls, micro-interactions
  menu: 0.24, // 240ms — Dropdowns, popovers, context menus
  overlay: 0.32, // 320ms — Drawers, modals, dialogs
  page: 0.35, // 350ms — Route content reveal
  editorial: 0.6, // 600ms — High-impact editorial media / hero reveals
} as const;

export const MOTION_EASINGS = {
  standard: [0.4, 0, 0.2, 1], // UI state feedback
  entrance: [0, 0, 0.2, 1], // Elements entering viewport/surface
  exit: [0.4, 0, 1, 1], // Elements exiting
  editorial: [0.16, 1, 0.3, 1], // Smooth luxury slow-out
} as const;

export const TRANSITIONS = {
  instant: { duration: MOTION_DURATIONS.instant, ease: MOTION_EASINGS.standard },
  control: { duration: MOTION_DURATIONS.control, ease: MOTION_EASINGS.standard },
  menuEntrance: { duration: MOTION_DURATIONS.menu, ease: MOTION_EASINGS.entrance },
  menuExit: { duration: MOTION_DURATIONS.menu * 0.75, ease: MOTION_EASINGS.exit },
  overlayEntrance: { duration: MOTION_DURATIONS.overlay, ease: MOTION_EASINGS.editorial },
  overlayExit: { duration: MOTION_DURATIONS.overlay * 0.75, ease: MOTION_EASINGS.exit },
  page: { duration: MOTION_DURATIONS.page, ease: MOTION_EASINGS.editorial },
  editorial: { duration: MOTION_DURATIONS.editorial, ease: MOTION_EASINGS.editorial },
} as const;

/**
 * Reusable Motion Variants
 */
export const VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeTranslateY: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },
  menuReveal: {
    initial: { opacity: 0, y: -6, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 0.98 },
  },
  dialogEntrance: {
    initial: { opacity: 0, scale: 0.98, y: 4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 4 },
  },
  drawerRight: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  drawerLeft: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  staggerContainer: (staggerChildren = 0.04) => ({
    initial: {},
    animate: {
      transition: {
        staggerChildren,
      },
    },
  }),
  staggerItem: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  },
  pageContent: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  },
} as const;

/**
 * Reduced Motion variant adapter: returns simplified variants without transforms or delays
 */
export function getMotionVariant<T extends Record<string, unknown>>(
  variant: T,
  shouldReduceMotion: boolean,
): T {
  if (!shouldReduceMotion) return variant;

  const reduced: Record<string, unknown> = {};
  for (const key of Object.keys(variant)) {
    const val = variant[key];
    if (typeof val === "object" && val !== null) {
      const copy = { ...(val as Record<string, unknown>) };
      delete copy.x;
      delete copy.y;
      delete copy.scale;
      delete copy.rotate;
      copy.transition = { duration: 0.01 };
      reduced[key] = copy;
    } else {
      reduced[key] = val;
    }
  }
  return reduced as T;
}
