export type AuditRunParams = {
    targetUrl: string;
    requesterId: string;
    endpoint: string;
} & { [prop: string]: string };