export const STATUS = {
  ALERT: 'alert',
  WARN: 'warn',
  INFO: 'info',
  PASS: 'pass',
} as const;

export const STATUS_COLOR = {
  [STATUS.ALERT]: 'red',
  [STATUS.WARN]: 'orange',
  [STATUS.INFO]: 'gray',
  [STATUS.PASS]: 'green',
} as const;

export const STATUS_ICON = {
  [STATUS.ALERT]: 'warning',
  [STATUS.WARN]: 'square',
  [STATUS.INFO]: 'circle',
  [STATUS.PASS]: 'circle',
} as const;
