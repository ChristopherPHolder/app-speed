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

export type ResultProgress = 'idle' | 'loading' | 'done';

export type AuditRunStatus = 'idle' | 'failed' | 'scheduled' | 'done';

export type AuditProgressStatus = AuditRunStatus | ResultProgress;
