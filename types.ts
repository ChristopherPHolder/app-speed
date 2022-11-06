export type AuditRunParams = {
    targetUrl: string;
    requesterId: string;
} & { [prop: string]: string };