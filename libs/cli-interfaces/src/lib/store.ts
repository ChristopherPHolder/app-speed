import { ResultReports } from 'shared';

export interface AuditStore {
  store(auditResults: ResultReports, location?: string): Promise<string>;
}
