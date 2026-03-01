export interface SsmDeployExecutorSchema {
  region: string;
  documentName?: string;
  instanceIds?: string[];
  imageRef?: string;
  commands?: string[];
  containerName?: string;
  hostPort?: number;
  containerPort?: number;
  additionalRunArgs?: string[];
  parameters?: Record<string, string[]>;
  waitForCompletion?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
  comment?: string;
}
