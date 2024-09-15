import { ResultReports } from '@app-speed/shared';

export interface AuditStore {
  store(auditResults: ResultReports, location?: string): Promise<string>;
}
