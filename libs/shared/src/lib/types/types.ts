
export type Reports = {
	htmlReportUrl?: string;
}
export type ResultReports = {
	jsonReport: string
	htmlReport: string
}

export type AuditRunParams = {
	audit: object;
	requesterId: string;
	endpoint: string;
};
