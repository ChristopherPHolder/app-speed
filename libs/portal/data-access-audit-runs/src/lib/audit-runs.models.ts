export type AuditRunStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
export type AuditResultStatus = 'SUCCESS' | 'FAILURE';

export interface ApiErrorResponse {
  code: 'INVALID_QUERY' | 'INVALID_CURSOR' | 'RUN_NOT_FOUND' | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

export interface AuditRunSummary {
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

export interface AuditRunsPage {
  items: ReadonlyArray<AuditRunSummary>;
  nextCursor: string | null;
  limit: number;
}

export interface ListAuditRunsParams {
  limit?: number;
  cursor?: string | null;
  status?: ReadonlyArray<AuditRunStatus>;
}

export const DEFAULT_AUDIT_RUN_FILTER: ReadonlyArray<AuditRunStatus> = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'];
