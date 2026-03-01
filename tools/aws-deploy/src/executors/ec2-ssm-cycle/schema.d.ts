export interface Ec2SsmCycleExecutorSchema {
  region: string;
  instanceId: string;
  documentName: string;
  parameters?: Record<string, string[]>;
  comment?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  startWaitTimeoutMs?: number;
  stopWaitTimeoutMs?: number;
  stopAfterCompletion?: boolean;
  stopOnlyIfStarted?: boolean;
}
