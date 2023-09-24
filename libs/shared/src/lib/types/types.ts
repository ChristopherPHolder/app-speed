
export type Reports = {
	htmlReportUrl?: string;
}
export type ResultReports = {
	jsonReport: string
	htmlReport: string
}

export type AuditRunParams = {
	targetUrl: object;
	requesterId: string;
	endpoint: string;
};
