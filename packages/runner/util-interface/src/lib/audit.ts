import { ResultReports } from './shared';

export interface AuditExecutor {
  exec(): Promise<void>;
}

export interface AuditRunner {
  results(): Promise<ResultReports>;
}
