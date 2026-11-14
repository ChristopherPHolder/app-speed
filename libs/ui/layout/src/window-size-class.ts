/**
 * Material 3 window size classes. The lower bound of each class in CSS pixels.
 * Mirrors `libs/ui/theme/_layout.scss`.
 */
export const WINDOW_SIZE_CLASS_MIN_WIDTH = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export type WindowSizeClass = keyof typeof WINDOW_SIZE_CLASS_MIN_WIDTH;

/**
 * Media queries that match a window size class and everything wider, for `BreakpointObserver` or
 * `matchMedia`. Layouts are written compact-first, so there is no query for compact itself.
 */
export const WINDOW_SIZE_CLASS = {
  mediumUp: `(width >= ${WINDOW_SIZE_CLASS_MIN_WIDTH.medium}px)`,
  expandedUp: `(width >= ${WINDOW_SIZE_CLASS_MIN_WIDTH.expanded}px)`,
  largeUp: `(width >= ${WINDOW_SIZE_CLASS_MIN_WIDTH.large}px)`,
  extraLargeUp: `(width >= ${WINDOW_SIZE_CLASS_MIN_WIDTH.extraLarge}px)`,
} as const;
