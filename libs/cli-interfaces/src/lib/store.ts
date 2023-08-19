import { ResultReports } from 'shared';

export interface AuditStore {
  store(auditResults: ResultReports): Promise<boolean>;
}
