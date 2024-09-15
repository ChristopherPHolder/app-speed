import { ResultReports } from '@app-speed/shared';

export interface AuditExecutor {
  exec(): Promise<void>;
}

export interface AuditRunner {
  results(): Promise<ResultReports>;
}
