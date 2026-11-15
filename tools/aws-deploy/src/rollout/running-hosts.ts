import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import { env } from 'node:process';

import { waitForSsmCommandCompletion } from '../lib/ssm.ts';

/** Replace a container on instances that are already running, over SSM `AWS-RunShellScript`. */
export interface RunningHostsRollout {
  region: string;
  documentName?: string;
  instanceIds: string[];
  imageRef: string;
  containerName?: string;
  hostPort?: number;
  containerPort?: number;
  /**
   * Extra `docker run` arguments. `-e NAME` passes `NAME` from this process's environment, so secrets reach the host
   * without being written to deployment state.
   */
  additionalRunArgs?: string[];
  pruneDockerBeforePull?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
  comment?: string;
}

const DEFAULT_DOCUMENT_NAME = 'AWS-RunShellScript';
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 900000;
const DEFAULT_CONTAINER_NAME = 'app-speed-api';
const DEFAULT_HOST_PORT = 3000;
const DEFAULT_CONTAINER_PORT = 3000;
const toTimeoutSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));

export type RolloutResult = {
  success: boolean;
  message: string;
  commandId: string;
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

const fail = (message: string): never => {
  throw new Error(message);
};

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'"'"'`)}'`;
const dockerEnvPassthroughPattern = /^-e\s+([A-Za-z_][A-Za-z0-9_]*)$/;

const resolveAdditionalRunArgs = (additionalRunArgs: string[]): string[] =>
  additionalRunArgs.map((arg) => {
    const match = dockerEnvPassthroughPattern.exec(arg);
    if (!match) {
      return arg;
    }

    const envName = match[1];
    const value = env[envName];
    if (!value?.trim()) {
      fail(`Missing environment variable ${envName} required by Docker run arg "${arg}"`);
    }

    return `-e ${shellQuote(`${envName}=${value}`)}`;
  });

const buildDefaultCommands = (
  imageRef: string,
  region: string,
  containerName: string,
  hostPort: number,
  containerPort: number,
  additionalRunArgs: string[],
  pruneDockerBeforePull: boolean,
): string[] => {
  const registry = imageRef.split('/')[0];
  const runArgs = additionalRunArgs.join(' ');
  const runArgsSuffix = runArgs ? ` ${runArgs}` : '';

  return [
    'set -euo pipefail',
    `IMAGE_REF=${shellQuote(imageRef)}`,
    `REGION=${shellQuote(region)}`,
    `REGISTRY=${shellQuote(registry)}`,
    'aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"',
    ...(pruneDockerBeforePull
      ? [
          'echo "Docker disk usage before cleanup"',
          'docker system df || true',
          `docker rm -f ${shellQuote(containerName)} || true`,
          'docker system prune -af || true',
          'docker builder prune -af || true',
          'echo "Docker disk usage after cleanup"',
          'docker system df || true',
          'docker pull "$IMAGE_REF"',
        ]
      : ['docker pull "$IMAGE_REF"', `docker rm -f ${shellQuote(containerName)} || true`]),
    `docker run -d --name ${shellQuote(containerName)} --restart unless-stopped -p ` +
      `${hostPort}:${containerPort}${runArgsSuffix} "$IMAGE_REF"`,
  ];
};

export const rolloutToRunningHosts = async (options: RunningHostsRollout): Promise<RolloutResult> => {
  const region = options.region?.trim();
  if (!region) {
    fail('Missing required option: region');
  }

  const documentName = options.documentName?.trim() || DEFAULT_DOCUMENT_NAME;
  const instanceIds = options.instanceIds.map((instanceId) => instanceId.trim()).filter(Boolean);
  if (instanceIds.length === 0) {
    fail('Missing EC2 instance ids');
  }

  const imageRef = options.imageRef?.trim();
  if (!imageRef) {
    fail('Missing image reference');
  }

  const containerName = options.containerName?.trim() || DEFAULT_CONTAINER_NAME;
  const hostPort = options.hostPort ?? DEFAULT_HOST_PORT;
  const containerPort = options.containerPort ?? DEFAULT_CONTAINER_PORT;
  const additionalRunArgs = resolveAdditionalRunArgs(
    (options.additionalRunArgs ?? []).map((arg) => arg.trim()).filter(Boolean),
  );
  const pruneDockerBeforePull = options.pruneDockerBeforePull === true;

  const commands = buildDefaultCommands(
    imageRef,
    region,
    containerName,
    hostPort,
    containerPort,
    additionalRunArgs,
    pruneDockerBeforePull,
  );

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const client = new SSMClient({ region });
  const sendCommand = new SendCommandCommand({
    DocumentName: documentName,
    InstanceIds: instanceIds,
    Parameters: { commands },
    Comment: options.comment,
    TimeoutSeconds: toTimeoutSeconds(timeoutMs),
  });
  const sendResponse = await client
    .send(sendCommand)
    .catch((error: unknown) =>
      fail(`Failed to submit SSM command in ${region} for instances ${instanceIds.join(', ')}: ${formatError(error)}`),
    );

  const commandId = sendResponse.Command?.CommandId ?? fail('SSM send command did not return commandId');

  const result = await waitForSsmCommandCompletion(client, commandId, instanceIds, timeoutMs, pollIntervalMs);
  if (!result.success) {
    fail(result.message);
  }
  return result;
};
