export type Reports = {
	htmlReportUrl?: string;
}
export type ResultReports = {
	jsonReport: string
	htmlReport: string
}

// @TODO remove unused types
export type AuditRunParams = {
	targetUrl: string;
	requesterId: string;
	endpoint: string;
} & Record<string, string>;
