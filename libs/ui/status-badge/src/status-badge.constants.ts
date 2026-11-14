export const STATUS = {
  ALERT: 'alert',
  WARN: 'warn',
  INFO: 'info',
  PASS: 'pass',
} as const;

/** The theme colour for each status, usable anywhere a CSS colour is. */
export const STATUS_COLOR = {
  [STATUS.ALERT]: 'var(--mat-sys-error)',
  [STATUS.WARN]: 'var(--ui-warning)',
  [STATUS.INFO]: 'var(--mat-sys-on-surface-variant)',
  [STATUS.PASS]: 'var(--ui-success)',
} as const;

/** Each status has its own shape so it never depends on colour alone. */
export const STATUS_ICON = {
  [STATUS.ALERT]: 'warning',
  [STATUS.WARN]: 'square',
  [STATUS.INFO]: 'radio_button_unchecked',
  [STATUS.PASS]: 'circle',
} as const;
