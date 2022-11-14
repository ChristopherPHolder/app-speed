export type AuditRunParams = {
	targetUrl: string;
	requesterId: string;
	endpoint: string;
} & Record<string, string>;

export type RunnerResponseMessage = {
	action: 'scheduled' | 'completed';
	message: string;
} & Record<string, string | Record<string, unknown>>;
