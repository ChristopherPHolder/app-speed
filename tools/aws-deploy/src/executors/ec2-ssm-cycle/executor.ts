import { PromiseExecutor } from '@nx/devkit';
import { EC2Client } from '@aws-sdk/client-ec2';
import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import { Effect } from 'effect';

import { waitForSsmCommandCompletion } from '../../lib/ssm';
import { Ec2SsmCycleExecutorSchema } from './schema';
import { StartedInstance, startInstanceIfNeeded, stopInstance } from './ec2';

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_COMMAND_TIMEOUT_MS = 900000;
const DEFAULT_START_WAIT_TIMEOUT_MS = 600000;
const DEFAULT_STOP_WAIT_TIMEOUT_MS = 600000;

type ExecutorExit = {
  success: boolean;
  message: string;
  commandId?: string;
};

const prepareInstance = (
  ec2Client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<StartedInstance, Error> => startInstanceIfNeeded(ec2Client, region, instanceId, startWaitTimeoutMs);

const stopInstanceIfConfigured = (
  ec2Client: EC2Client,
  started: StartedInstance,
  instanceId: string,
  stopAfterCompletion: boolean,
  stopOnlyIfStarted: boolean,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    if (!stopAfterCompletion) {
      return;
    }
    if (stopOnlyIfStarted && !started.startedByExecutor) {
      return;
    }
    yield* stopInstance(ec2Client, instanceId, stopWaitTimeoutMs);
  });

const runSsmCommand = (
  ssmClient: SSMClient,
  documentName: string,
  instanceId: string,
  parameters: Record<string, string[]> | undefined,
  comment: string | undefined,
  timeoutMs: number,
  pollIntervalMs: number,
): Effect.Effect<ExecutorExit, Error> =>
  Effect.gen(function* () {
    const sendResponse = yield* Effect.tryPromise({
      try: () =>
        ssmClient.send(
          new SendCommandCommand({
            DocumentName: documentName,
            InstanceIds: [instanceId],
            Parameters: parameters,
            Comment: comment,
          }),
        ),
      catch: (error) => new Error(`Failed to send SSM command to ${instanceId}: ${String(error)}`),
    });

    const commandId = yield* Effect.fromNullable(sendResponse.Command?.CommandId).pipe(
      Effect.mapError(() => new Error('SSM send command did not return commandId')),
    );

    const result = yield* Effect.tryPromise({
      try: () => waitForSsmCommandCompletion(ssmClient, commandId, [instanceId], timeoutMs, pollIntervalMs),
      catch: (error) => new Error(`Failed to wait for SSM command ${commandId}: ${String(error)}`),
    });

    if (!result.success) {
      return yield* Effect.fail(new Error(result.message));
    }

    return result;
  });

const program = (options: Ec2SsmCycleExecutorSchema): Effect.Effect<ExecutorExit, Error> =>
  Effect.gen(function* () {
    const region = options.region.trim();
    if (!region) {
      throw new Error('Missing required option: region');
    }

    const instanceId = options.instanceId.trim();
    if (!instanceId) {
      throw new Error('Missing EC2 instance ID. Set options.instanceId');
    }

    const documentName = options.documentName.trim();
    if (!documentName) {
      throw new Error('Missing SSM document name. Set options.documentName');
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const startWaitTimeoutMs = options.startWaitTimeoutMs ?? DEFAULT_START_WAIT_TIMEOUT_MS;
    const stopWaitTimeoutMs = options.stopWaitTimeoutMs ?? DEFAULT_STOP_WAIT_TIMEOUT_MS;
    const stopAfterCompletion = options.stopAfterCompletion !== false;
    const stopOnlyIfStarted = options.stopOnlyIfStarted !== false;

    const ec2Client = new EC2Client({ region });
    const ssmClient = new SSMClient({ region });

    return yield* Effect.acquireUseRelease(
      prepareInstance(ec2Client, region, instanceId, startWaitTimeoutMs),
      () =>
        runSsmCommand(
          ssmClient,
          documentName,
          instanceId,
          options.parameters,
          options.comment,
          timeoutMs,
          pollIntervalMs,
        ),
      (started) =>
        stopInstanceIfConfigured(
          ec2Client,
          started,
          instanceId,
          stopAfterCompletion,
          stopOnlyIfStarted,
          stopWaitTimeoutMs,
        ).pipe(Effect.orDie),
    ).pipe(Effect.scoped);
  });

const runExecutor: PromiseExecutor<Ec2SsmCycleExecutorSchema> = async (options) => Effect.runPromise(program(options));

export default runExecutor;
