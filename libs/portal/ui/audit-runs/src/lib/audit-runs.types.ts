export type AuditRunStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
export type AuditResultStatus = 'SUCCESS' | 'FAILURE';

export interface AuditRunRow {
  auditId: string;
  title: string;
  status: AuditRunStatus;
  resultStatus: AuditResultStatus | null;
  queuePosition: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
}

export const DEFAULT_AUDIT_RUN_FILTER: ReadonlyArray<AuditRunStatus> = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'];
