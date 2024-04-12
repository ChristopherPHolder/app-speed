export const STATUS_OPTIONS = {
  ALERT: 'alert',
  WARN: 'warn',
  INFO: 'info',
  PASS: 'pass'
} as const;

export const STATUS_COLOR = {
  [STATUS_OPTIONS.ALERT]: 'red',
  [STATUS_OPTIONS.WARN]: 'orange',
  [STATUS_OPTIONS.INFO]: 'gray',
  [STATUS_OPTIONS.PASS]: 'green'
} as const;

export const STATUS_ICON = {
  [STATUS_OPTIONS.ALERT]: 'warning',
  [STATUS_OPTIONS.WARN]: 'square',
  [STATUS_OPTIONS.INFO]: 'circle',
  [STATUS_OPTIONS.PASS]: 'circle',
} as const;
