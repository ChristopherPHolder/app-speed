import { GetCommandInvocationCommand, SSMClient } from '@aws-sdk/client-ssm';

export type SsmCommandCompletionResult = {
  success: boolean;
  message: string;
  commandId: string;
};

type InvocationSnapshot = {
  normalizedStatus: string;
  displayStatus: string;
  responseCode: number | null;
  standardOutputContent: string;
  standardErrorContent: string;
};

const MAX_OUTPUT_SNIPPET_LENGTH = 280;

const normalizeStatus = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-_]+/g, '');

const isSuccessful = (status: string): boolean => normalizeStatus(status) === 'success';

const isInProgress = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return (
    normalized === '' ||
    normalized === 'unknown' ||
    normalized === 'pending' ||
    normalized === 'inprogress' ||
    normalized === 'delayed'
  );
};

const summarizeOutput = (value?: string): string => {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= MAX_OUTPUT_SNIPPET_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_OUTPUT_SNIPPET_LENGTH - 3)}...`;
};

const formatSnapshots = (snapshotsByInstance: Record<string, InvocationSnapshot>): string =>
  Object.entries(snapshotsByInstance)
    .map(([instanceId, snapshot]) => {
      const parts = [`${instanceId}=${snapshot.displayStatus || 'pending'}`];

      if (snapshot.responseCode !== null && snapshot.responseCode !== -1) {
        parts.push(`exit=${snapshot.responseCode}`);
      }

      if (snapshot.standardErrorContent) {
        parts.push(`stderr=${JSON.stringify(snapshot.standardErrorContent)}`);
      } else if (snapshot.standardOutputContent) {
        parts.push(`stdout=${JSON.stringify(snapshot.standardOutputContent)}`);
      }

      return parts.join(' ');
    })
    .join(', ');

const delay = (durationMs: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, durationMs));

const getInvocationSnapshot = async (
  client: SSMClient,
  commandId: string,
  instanceId: string,
): Promise<InvocationSnapshot> => {
  try {
    const response = await client.send(
      new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      }),
    );
    const status = response.StatusDetails ?? response.Status ?? 'unknown';

    return {
      normalizedStatus: normalizeStatus(status),
      displayStatus: status,
      responseCode: response.ResponseCode ?? null,
      standardOutputContent: summarizeOutput(response.StandardOutputContent),
      standardErrorContent: summarizeOutput(response.StandardErrorContent),
    };
  } catch {
    return {
      normalizedStatus: 'unknown',
      displayStatus: 'unknown',
      responseCode: null,
      standardOutputContent: '',
      standardErrorContent: '',
    };
  }
};

export const waitForSsmCommandCompletion = async (
  client: SSMClient,
  commandId: string,
  instanceIds: string[],
  timeoutMs: number,
  pollIntervalMs: number,
  onProgress?: (message: string) => void,
): Promise<SsmCommandCompletionResult> => {
  const deadline = Date.now() + timeoutMs;

  const statuses = await Promise.all(
    instanceIds.map(async (instanceId) => {
      let lastProgress = '';
      while (true) {
        const snapshot = await getInvocationSnapshot(client, commandId, instanceId);
        if (onProgress) {
          const progress = formatSnapshots({ [instanceId]: snapshot });
          if (progress !== lastProgress) {
            lastProgress = progress;
            onProgress(`SSM command ${commandId} progress: ${progress}`);
          }
        }

        if (isSuccessful(snapshot.normalizedStatus) || !isInProgress(snapshot.normalizedStatus)) {
          return [instanceId, snapshot] as const;
        }

        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          return [instanceId, snapshot] as const;
        }

        await delay(Math.min(pollIntervalMs, remainingMs));
      }
    }),
  );

  const snapshotsByInstance = Object.fromEntries(statuses);
  const values = Object.values(snapshotsByInstance);

  if (values.every((snapshot) => isSuccessful(snapshot.normalizedStatus))) {
    return {
      success: true,
      commandId,
      message: `SSM command ${commandId} completed successfully: ${formatSnapshots(snapshotsByInstance)}`,
    };
  }

  const failed = values.find(
    (snapshot) => !isSuccessful(snapshot.normalizedStatus) && !isInProgress(snapshot.normalizedStatus),
  );
  if (failed) {
    return {
      success: false,
      commandId,
      message: `SSM command ${commandId} failed: ${formatSnapshots(snapshotsByInstance)}`,
    };
  }

  return {
    success: false,
    commandId,
    message: `SSM command ${commandId} timed out after ${timeoutMs}ms: ${formatSnapshots(snapshotsByInstance)}`,
  };
};
