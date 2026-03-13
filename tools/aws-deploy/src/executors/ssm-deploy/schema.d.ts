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
  pruneDockerBeforePull?: boolean;
  parameters?: Record<string, string[]>;
  waitForCompletion?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
  comment?: string;
}
