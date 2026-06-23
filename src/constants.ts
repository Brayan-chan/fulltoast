export const DEFAULT_TOAST_DURATION = 6000;
export const EXIT_DURATION = 220;
export const AUTO_EXPAND_DELAY = 160;
export const AUTO_COLLAPSE_DELAY = DEFAULT_TOAST_DURATION - 2000;

export const TOAST_MIN_HEIGHT = 48;
export const TOAST_WIDTH = 342;
export const TOAST_GAP = 10;
export const DEFAULT_ROUNDNESS = 18;

export const MOTION = {
  entry: { stiffness: 560, damping: 38 },
  exit: { stiffness: 720, damping: 48 },
  expand: { stiffness: 460, damping: 36 },
  drag: { stiffness: 680, damping: 42 },
  swap: { stiffness: 620, damping: 34 },
} as const;
