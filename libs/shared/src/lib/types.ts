export type AuditRunParams = {
	targetUrl: string;
	requesterId: string;
	endpoint: string;
} & Record<string, string>;

export type RunnerResponseMessage = {
	action: 'scheduled' | 'completed';
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