export const CONDUCTOR_STAGE = {
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const satisfies Record<string, string>;
