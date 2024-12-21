export const AUDIT_STATUS = {
  IDLE: 'idle',
  SCHEDULING: 'scheduling',
  QUEUED: 'queued',
  LOADING: 'loading',
  DONE: 'done',
  FAILED: 'failed',
} as const;
export const AUDIT_REQUEST = {
  SCHEDULE_AUDIT: 'scheduleAudits',
} as const;
