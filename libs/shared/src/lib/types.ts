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
//
// const KeyToVal = {
// 	MyKey1: 'myValue1',
// 	MyKey2: 'myValue2',
// } as const; // <----- add the <as const> here

//type Keys = keyof typeof KeyToVal;

// type ValuesTypes = typeof KeyToVal[Keys];
//
//
// const resultProgress = {
// 	LOADING: 'loading',
// } as const;



//export type ResultProgress = 'loading' | 'done';

export const KeyToAuditRunStatus = {
	IDLE: 'idle',
	SCHEDULING: 'scheduling',
	QUEUED: 'queued',
	LOADING: 'loading',
	DONE: 'done',
	FAILED: 'failed'
} as const;

type AuditRunStatusKeys = keyof typeof KeyToAuditRunStatus;

export type AuditRunStatus = typeof KeyToAuditRunStatus[AuditRunStatusKeys];

//export type AuditRunStatus = 'idle' | 'scheduling' | 'queued'  | 'scheduled' | 'loading' | 'done' | 'failed';

//export type AuditProgressStatus = AuditRunStatus | ResultProgress;
