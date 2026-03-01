import {
  GetCommandInvocationCommand,
  SSMClient,
  waitUntilCommandExecuted,
  type CommandInvocationStatus,
} from '@aws-sdk/client-ssm';

export type SsmCommandCompletionResult = {
  success: boolean;
  message: string;
  commandId: string;
};

const normalizeStatus = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-_]+/g, '');

const isSuccessful = (status: string): boolean => normalizeStatus(status) === 'success';

const isInProgress = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === '' || normalized === 'pending' || normalized === 'inprogress' || normalized === 'delayed';
};

const formatStatuses = (statusesByInstance: Record<string, string>): string =>
  Object.entries(statusesByInstance)
    .map(([instanceId, status]) => `${instanceId}=${status || 'pending'}`)
    .join(', ');

const toWaitSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));
const toDelaySeconds = (pollIntervalMs: number): number => Math.max(1, Math.ceil(pollIntervalMs / 1000));

const getInvocationStatus = async (
  client: SSMClient,
  commandId: string,
  instanceId: string,
): Promise<CommandInvocationStatus | string> => {
  try {
    const response = await client.send(
      new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      }),
    );
    return response.StatusDetails ?? response.Status ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

export const waitForSsmCommandCompletion = async (
  client: SSMClient,
  commandId: string,
  instanceIds: string[],
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<SsmCommandCompletionResult> => {
  const maxWaitTime = toWaitSeconds(timeoutMs);
  const delaySeconds = toDelaySeconds(pollIntervalMs);

  const statuses = await Promise.all(
    instanceIds.map(async (instanceId) => {
      try {
        await waitUntilCommandExecuted(
          {
            client,
            maxWaitTime,
            minDelay: delaySeconds,
            maxDelay: delaySeconds,
          },
          {
            CommandId: commandId,
            InstanceId: instanceId,
          },
        );
      } catch {
        // We still fetch the final invocation status below to build a precise message.
      }

      return [instanceId, normalizeStatus(await getInvocationStatus(client, commandId, instanceId))] as const;
    }),
  );

  const statusesByInstance = Object.fromEntries(statuses);
  const values = Object.values(statusesByInstance);

  if (values.every(isSuccessful)) {
    return {
      success: true,
      commandId,
      message: `SSM command ${commandId} completed successfully: ${formatStatuses(statusesByInstance)}`,
    };
  }

  const failed = values.find((status) => !isSuccessful(status) && !isInProgress(status));
  if (failed) {
    return {
      success: false,
      commandId,
      message: `SSM command ${commandId} failed: ${formatStatuses(statusesByInstance)}`,
    };
  }

  return {
    success: false,
    commandId,
    message: `SSM command ${commandId} timed out after ${timeoutMs}ms`,
  };
};
