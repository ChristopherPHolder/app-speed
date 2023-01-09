export type AuditRunParams = {
	targetUrl: string;
	requesterId: string;
	endpoint: string;
} & Record<string, string>;

export type RunnerResponseMessage = {
	action: AuditRunStatus;
	message: string;
	reports?: Reports;
} & Record<string, string | Record<string, unknown>>;

export type AuditRequestParams = {
	targetUrl: string;
	action: 'scheduleAudits' | string;
}

export type Reports = {
	htmlReportUrl?: string;
}

export type ResultReports = {
	jsonReport: string
	htmlReport: string
}

export type ResultProgress = 'loading' | 'done';

export type AuditRunStatus = 'idle' | 'scheduling' | 'queued'  | 'scheduled' | 'done' | 'failed';

export type AuditProgressStatus = AuditRunStatus | ResultProgress;
