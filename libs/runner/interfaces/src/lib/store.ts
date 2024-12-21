import { ResultReports } from '@app-speed/shared-utils';

export interface AuditStore {
  store(auditResults: ResultReports, location?: string): Promise<string>;
}
