import { KeyToAuditRunStatus } from './constants';

export type AuditRunParams = {
	targetUrl: string;
	requesterId: string;
	endpoint: string;
} & Record<string, string>;


type WsAction<A extends AuditRunStatus,T> = {
	type: A,
	payload: T
}

export type UfWsActions = WsAction<'done', Reports>
	| WsAction<'idle', string>
	| WsAction<'scheduling', string>
	| WsAction<'queued', string>
	| WsAction<'loading', string>
	| WsAction<'failed', string>;


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
type AuditRunStatusKeys = keyof typeof KeyToAuditRunStatus;

export type AuditRunStatus = typeof KeyToAuditRunStatus[AuditRunStatusKeys];
