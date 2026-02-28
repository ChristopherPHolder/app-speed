import { PromiseExecutor } from '@nx/devkit';
import { ListCommandInvocationsCommand, SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import { env } from 'node:process';

import { SsmDeployExecutorSchema } from './schema';

const DEFAULT_DOCUMENT_NAME = 'AWS-RunShellScript';
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 900000;
const DEFAULT_CONTAINER_NAME = 'app-speed-server';
const DEFAULT_HOST_PORT = 3000;
const DEFAULT_CONTAINER_PORT = 3000;

type ExecutorExit = {
  success: boolean;
  message: string;
  commandId?: string;
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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const parseInstanceIds = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((instanceId) => instanceId.trim())
    .filter(Boolean);

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'"'"'`)}'`;

const normalizeStatus = (value?: string): string => (value ?? '').trim().toLowerCase().replace(/[\s-_]+/g, '');

const isSuccessful = (status: string): boolean => normalizeStatus(status) === 'success';

const isInProgress = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === '' || normalized === 'pending' || normalized === 'inprogress' || normalized === 'delayed';
};

const formatStatuses = (statusesByInstance: Record<string, string>): string =>
  Object.entries(statusesByInstance)
    .map(([instanceId, status]) => `${instanceId}=${status || 'pending'}`)
    .join(', ');

const buildDefaultCommands = (
  imageRef: string,
  region: string,
  containerName: string,
  hostPort: number,
  containerPort: number,
  additionalRunArgs: string[],
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
    'docker pull "$IMAGE_REF"',
    `docker rm -f ${shellQuote(containerName)} || true`,
    `docker run -d --name ${shellQuote(containerName)} --restart unless-stopped -p ` +
      `${hostPort}:${containerPort}${runArgsSuffix} "$IMAGE_REF"`,
  ];
};

const waitForCompletion = async (
  client: SSMClient,
  commandId: string,
  instanceIds: string[],
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<ExecutorExit> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await client.send(
      new ListCommandInvocationsCommand({
        CommandId: commandId,
        Details: false,
      }),
    );

    const statusesByInstance: Record<string, string> = Object.fromEntries(
      instanceIds.map((instanceId) => [instanceId, 'pending']),
    );

    for (const invocation of response.CommandInvocations ?? []) {
      const instanceId = invocation.InstanceId;
      if (!instanceId || !instanceIds.includes(instanceId)) {
        continue;
      }
      statusesByInstance[instanceId] = normalizeStatus(invocation.StatusDetails ?? invocation.Status);
    }

    const statuses = Object.values(statusesByInstance);
    const allSuccessful = statuses.every(isSuccessful);
    if (allSuccessful) {
      return {
        success: true,
        commandId,
        message: `SSM command ${commandId} completed successfully: ${formatStatuses(statusesByInstance)}`,
      };
    }

    const failedStatus = statuses.find((status) => !isSuccessful(status) && !isInProgress(status));
    if (failedStatus) {
      return {
        success: false,
        commandId,
        message: `SSM command ${commandId} failed: ${formatStatuses(statusesByInstance)}`,
      };
    }

    await sleep(pollIntervalMs);
  }

  return {
    success: false,
    commandId,
    message: `SSM command ${commandId} timed out after ${timeoutMs}ms`,
  };
};

const runExecutor: PromiseExecutor<SsmDeployExecutorSchema> = async (options): Promise<ExecutorExit> => {
  const region = options.region?.trim();
  if (!region) {
    fail('Missing required option: region');
  }

  const documentName = options.documentName?.trim() || DEFAULT_DOCUMENT_NAME;
  if (!documentName) {
    fail('Missing SSM document name');
  }

  const optionInstanceIds = (options.instanceIds ?? []).map((instanceId) => instanceId.trim()).filter(Boolean);
  const envInstanceIds = parseInstanceIds(env.SERVER_SSM_INSTANCE_IDS);
  const instanceIds = optionInstanceIds.length > 0 ? optionInstanceIds : envInstanceIds;
  if (instanceIds.length === 0) {
    fail('Missing EC2 instance ids. Set options.instanceIds or SERVER_SSM_INSTANCE_IDS');
  }

  const imageRef = options.imageRef?.trim() || env.SERVER_IMAGE_REF?.trim();
  const hasCustomCommands = (options.commands ?? []).some((command) => command.trim().length > 0);
  const defaultImageRef = imageRef ?? '';
  if (!hasCustomCommands && defaultImageRef.length === 0) {
    fail('Missing image reference. Set options.imageRef or SERVER_IMAGE_REF');
  }

  const containerName = options.containerName?.trim() || DEFAULT_CONTAINER_NAME;
  const hostPort = options.hostPort ?? DEFAULT_HOST_PORT;
  const containerPort = options.containerPort ?? DEFAULT_CONTAINER_PORT;
  const additionalRunArgs = (options.additionalRunArgs ?? []).map((arg) => arg.trim()).filter(Boolean);

  const commands = hasCustomCommands
    ? (options.commands ?? []).map((command) => command.trim()).filter(Boolean)
    : buildDefaultCommands(defaultImageRef, region, containerName, hostPort, containerPort, additionalRunArgs);

  const parameters: Record<string, string[]> = {
    commands,
    ...(options.parameters ?? {}),
  };

  const client = new SSMClient({ region });
  const sendCommand = new SendCommandCommand({
    DocumentName: documentName,
    InstanceIds: instanceIds,
    Parameters: parameters,
    Comment: options.comment,
  });
  const sendResponse = await client
    .send(sendCommand)
    .catch((error: unknown) =>
      fail(
        `Failed to submit SSM command in ${region} for instances ${instanceIds.join(', ')}: ${formatError(error)}`,
      ),
    );

  const commandId = sendResponse.Command?.CommandId;
  if (!commandId) {
    fail('SSM send command did not return commandId');
  }

  if (options.waitForCompletion === false) {
    return {
      success: true,
      commandId,
      message: `SSM command submitted: ${commandId}`,
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const result = await waitForCompletion(client, commandId, instanceIds, timeoutMs, pollIntervalMs);
  if (!result.success) {
    fail(result.message);
  }
  return result;
};

export default runExecutor;
