import { ListCommandInvocationsCommand, SSMClient } from '@aws-sdk/client-ssm';

export type SsmCommandCompletionResult = {
  success: boolean;
  message: string;
  commandId: string;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

export const waitForSsmCommandCompletion = async (
  client: SSMClient,
  commandId: string,
  instanceIds: string[],
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<SsmCommandCompletionResult> => {
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
    if (statuses.every(isSuccessful)) {
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
