export interface Ec2SsmCycleExecutorSchema {
  region: string;
  instanceId: string;
  documentName?: string;
  imageRef?: string;
  commands?: string[];
  containerName?: string;
  hostPort?: number;
  containerPort?: number;
  additionalRunArgs?: string[];
  parameters?: Record<string, string[]>;
  comment?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  startWaitTimeoutMs?: number;
  stopWaitTimeoutMs?: number;
  stopAfterCompletion?: boolean;
  stopOnlyIfStarted?: boolean;
}
