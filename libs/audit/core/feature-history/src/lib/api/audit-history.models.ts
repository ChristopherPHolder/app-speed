export type AuditRunStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
export type AuditResultStatus = 'SUCCESS' | 'FAILURE';

export interface AuditRunSummary {
  kind: string;
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

export interface AuditHistoryPage {
  items: ReadonlyArray<AuditRunSummary>;
  nextCursor: string | null;
  limit: number;
}

export interface ListAuditHistoryParams {
  limit?: number;
  cursor?: string | null;
  status?: ReadonlyArray<AuditRunStatus>;
}

export type AuditHistoryResultRoute = (run: AuditRunSummary) => ReadonlyArray<string>;

export interface AuditHistoryRouteConfig {
  endpoint: string;
  resultRoute: AuditHistoryResultRoute;
}

export const DEFAULT_AUDIT_RUN_FILTER: ReadonlyArray<AuditRunStatus> = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'];
