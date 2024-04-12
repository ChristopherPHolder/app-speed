export interface AuditExecutor {
  exec(): Promise<void>;
}
