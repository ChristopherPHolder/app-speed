import { PromiseExecutor } from '@nx/devkit';
import { EC2Client } from '@aws-sdk/client-ec2';
import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';
import { env } from 'node:process';
import { Effect } from 'effect';

import { waitForSsmCommandCompletion } from '../../lib/ssm';
import { Ec2SsmCycleExecutorSchema } from './schema';
import { StartedInstance, startInstanceIfNeeded, stopInstance } from './ec2';
import { Ec2SsmCycleError } from './errors';

const DEFAULT_DOCUMENT_NAME = 'AWS-RunShellScript';
const DEFAULT_CONTAINER_NAME = 'app-speed-runner';
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_COMMAND_TIMEOUT_MS = 900000;
const DEFAULT_START_WAIT_TIMEOUT_MS = 600000;
const DEFAULT_STOP_WAIT_TIMEOUT_MS = 600000;

type ExecutorExit = {
  success: boolean;
  message: string;
  commandId?: string;
};

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'"'"'`)}'`;

const buildDefaultCommands = (
  imageRef: string,
  region: string,
  containerName: string,
  hostPort: number | undefined,
  containerPort: number | undefined,
  additionalRunArgs: string[],
): string[] => {
  if ((hostPort === undefined) !== (containerPort === undefined)) {
    throw new Ec2SsmCycleError({
      message: 'hostPort and containerPort must both be provided, or both omitted',
    });
  }

  const registry = imageRef.split('/')[0];
  const runArgs = additionalRunArgs.join(' ');
  const runArgsSuffix = runArgs ? ` ${runArgs}` : '';
  const portFlag = hostPort !== undefined && containerPort !== undefined ? ` -p ${hostPort}:${containerPort}` : '';

  return [
    'set -euo pipefail',
    `IMAGE_REF=${shellQuote(imageRef)}`,
    `REGION=${shellQuote(region)}`,
    `REGISTRY=${shellQuote(registry)}`,
    'aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"',
    'docker pull "$IMAGE_REF"',
    `docker rm -f ${shellQuote(containerName)} || true`,
    [
      `docker run -d --name ${shellQuote(containerName)}`,
      `--restart unless-stopped${portFlag}${runArgsSuffix} "$IMAGE_REF"`,
    ].join(' '),
  ];
};

const resolveCommands = (options: Ec2SsmCycleExecutorSchema, region: string): string[] => {
  const customCommands = (options.commands ?? []).map((command) => command.trim()).filter(Boolean);
  if (customCommands.length > 0) {
    return customCommands;
  }

  const imageRef = options.imageRef?.trim() || env.RUNNER_IMAGE_REF?.trim() || env.SERVER_IMAGE_REF?.trim();
  if (!imageRef) {
    throw new Ec2SsmCycleError({
      message: 'Missing image reference. Set options.imageRef or RUNNER_IMAGE_REF',
    });
  }

  const containerName = options.containerName?.trim() || DEFAULT_CONTAINER_NAME;
  const additionalRunArgs = (options.additionalRunArgs ?? []).map((arg) => arg.trim()).filter(Boolean);

  return buildDefaultCommands(
    imageRef,
    region,
    containerName,
    options.hostPort,
    options.containerPort,
    additionalRunArgs,
  );
};

const prepareInstance = (
  ec2Client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<StartedInstance, Ec2SsmCycleError> =>
  startInstanceIfNeeded(ec2Client, region, instanceId, startWaitTimeoutMs);

const stopInstanceIfConfigured = (
  ec2Client: EC2Client,
  started: StartedInstance,
  instanceId: string,
  stopAfterCompletion: boolean,
  stopOnlyIfStarted: boolean,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
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
): Effect.Effect<ExecutorExit, Ec2SsmCycleError> =>
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
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to send SSM command to ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    const commandId = yield* Effect.fromNullable(sendResponse.Command?.CommandId).pipe(
      Effect.mapError(
        () =>
          new Ec2SsmCycleError({
            message: 'SSM send command did not return commandId',
          }),
      ),
    );

    const result = yield* Effect.tryPromise({
      try: () => waitForSsmCommandCompletion(ssmClient, commandId, [instanceId], timeoutMs, pollIntervalMs),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to wait for SSM command ${commandId}: ${String(error)}`,
          cause: error,
        }),
    });

    if (!result.success) {
      return yield* new Ec2SsmCycleError({ message: result.message });
    }

    return result;
  });

const program = (options: Ec2SsmCycleExecutorSchema): Effect.Effect<ExecutorExit, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const region = options.region.trim();
    if (!region) {
      return yield* new Ec2SsmCycleError({ message: 'Missing required option: region' });
    }

    const instanceId = options.instanceId.trim();
    if (!instanceId) {
      return yield* new Ec2SsmCycleError({
        message: 'Missing EC2 instance ID. Set options.instanceId',
      });
    }

    const documentName = options.documentName?.trim() || DEFAULT_DOCUMENT_NAME;
    if (!documentName) {
      return yield* new Ec2SsmCycleError({
        message: 'Missing SSM document name. Set options.documentName',
      });
    }

    const commands = resolveCommands(options, region);
    const parameters: Record<string, string[]> = {
      commands,
      ...(options.parameters ?? {}),
    };

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
          parameters,
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
