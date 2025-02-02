export const EVENT_MESSAGE = {
  STAGE_CHANGE: 'stage-change',
} as const satisfies Record<string, string>;

export const AUDIT_STAGE = {
  BUILDING: 'building',
  PROCESSING: 'processing',
  SCHEDULING: 'scheduling',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const satisfies Record<string, string>;

export const AUDIT_STAGE_CHANGE_EVENT = [
  AUDIT_STAGE.SCHEDULED,
  AUDIT_STAGE.RUNNING,
  AUDIT_STAGE.DONE,
] satisfies string[];
