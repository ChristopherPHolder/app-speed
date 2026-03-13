import {
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  EC2Client,
  GetConsoleOutputCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  waitUntilInstanceRunning,
  waitUntilInstanceStopped,
} from '@aws-sdk/client-ec2';
import { Duration, Effect } from 'effect';

import { Ec2SsmCycleError } from './errors';

export type StartedInstance = {
  startedByExecutor: boolean;
};

type Ec2InstanceStateName = 'pending' | 'running' | 'shutting-down' | 'terminated' | 'stopping' | 'stopped' | 'unknown';

type InstanceDiagnostics = {
  instanceState?: string;
  stateReason?: string;
  transitionReason?: string;
  systemStatus?: string;
  instanceStatus?: string;
  launchTime?: string;
  events?: string[];
  consoleOutputExcerpt?: string;
};

const BOOTSTRAP_POLL_INTERVAL_MS = 5000;
const toWaitSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeWaiterError = (error: unknown): unknown => {
  if (!(error instanceof Error) || !error.message) {
    return error;
  }

  const message = error.message.trim();
  if (!message || message === '[object Object]') {
    return error;
  }

  if (message.startsWith('{')) {
    try {
      return JSON.parse(message);
    } catch {
      return error;
    }
  }

  return error;
};

const getObservedInstanceDetails = (
  error: unknown,
): {
  waiterState?: string;
  observedResponses?: string;
  instanceState?: string;
  stateReason?: string;
  transitionReason?: string;
} => {
  const normalizedError = normalizeWaiterError(error);

  if (!isRecord(normalizedError)) {
    return {};
  }

  const waiterState = typeof normalizedError.state === 'string' ? normalizedError.state : undefined;
  const observedResponsesRecord = isRecord(normalizedError.observedResponses) ? normalizedError.observedResponses : undefined;
  const observedResponses = observedResponsesRecord
    ? Object.entries(observedResponsesRecord)
        .filter(([, count]) => typeof count === 'number')
        .map(([status, count]) => `${status} x${count}`)
        .join('; ')
    : undefined;
  const reason = isRecord(normalizedError.reason) ? normalizedError.reason : undefined;
  const reservations = Array.isArray(reason?.Reservations) ? reason.Reservations : [];
  const firstReservation = reservations.find(isRecord);
  const instances = Array.isArray(firstReservation?.Instances) ? firstReservation.Instances : [];
  const firstInstance = instances.find(isRecord);

  const state = isRecord(firstInstance?.State) ? firstInstance.State : undefined;
  const stateReason = isRecord(firstInstance?.StateReason) ? firstInstance.StateReason : undefined;

  return {
    waiterState,
    observedResponses,
    instanceState: typeof state?.Name === 'string' ? state.Name : undefined,
    stateReason: typeof stateReason?.Message === 'string' ? stateReason.Message : undefined,
    transitionReason:
      typeof firstInstance?.StateTransitionReason === 'string' ? firstInstance.StateTransitionReason : undefined,
  };
};

const formatWaiterError = (error: unknown): string => {
  const normalizedError = normalizeWaiterError(error);
  if (
    normalizedError instanceof Error &&
    normalizedError.message &&
    normalizedError.message !== '[object Object]' &&
    !normalizedError.message.trim().startsWith('{')
  ) {
    return normalizedError.message;
  }

  const details = getObservedInstanceDetails(normalizedError);
  const parts = [
    details.waiterState ? `waiter state=${details.waiterState}` : null,
    details.observedResponses ? `observed responses=${details.observedResponses}` : null,
    details.instanceState ? `instance state=${details.instanceState}` : null,
    details.stateReason ? `state reason=${details.stateReason}` : null,
    details.transitionReason ? `transition reason=${details.transitionReason}` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join(', ') : String(error);
};

const toDiagnosticsLookupError = (operation: string, instanceId: string, error: unknown): Ec2SsmCycleError =>
  new Ec2SsmCycleError({
    message: `Failed to ${operation} for instance ${instanceId}: ${String(error)}`,
    cause: error,
  });

const toWaiterError = (error: unknown): Ec2SsmCycleError =>
  new Ec2SsmCycleError({
    message: formatWaiterError(error),
    cause: error,
  });

const looksBase64 = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, '');
  return normalized.length > 0 && normalized.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(normalized);
};

const toConsoleOutputExcerpt = (output: string | undefined): string | undefined => {
  if (!output) {
    return undefined;
  }

  const decoded = looksBase64(output) ? Buffer.from(output, 'base64').toString('utf8') : output;
  const lines = decoded
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return undefined;
  }

  return lines.join(' | ').slice(-2000);
};

const formatInstanceDiagnostics = (diagnostics: InstanceDiagnostics): string => {
  const parts = [
    diagnostics.instanceState ? `instance state=${diagnostics.instanceState}` : null,
    diagnostics.stateReason ? `state reason=${diagnostics.stateReason}` : null,
    diagnostics.transitionReason ? `transition reason=${diagnostics.transitionReason}` : null,
    diagnostics.systemStatus ? `system status=${diagnostics.systemStatus}` : null,
    diagnostics.instanceStatus ? `instance status=${diagnostics.instanceStatus}` : null,
    diagnostics.launchTime ? `launch time=${diagnostics.launchTime}` : null,
    diagnostics.events && diagnostics.events.length > 0 ? `events=${diagnostics.events.join(' | ')}` : null,
    diagnostics.consoleOutputExcerpt ? `console output=${diagnostics.consoleOutputExcerpt}` : null,
  ].filter((value): value is string => value !== null);

  return parts.join(', ');
};

const describeInstanceDiagnostics = (
  client: EC2Client,
  instanceId: string,
): Effect.Effect<InstanceDiagnostics, never> =>
  Effect.gen(function* () {
    const diagnostics: InstanceDiagnostics = {};

    const describeInstancesResponse = yield* Effect.tryPromise({
      try: () => client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => toDiagnosticsLookupError('describe EC2 state', instanceId, error),
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    if (describeInstancesResponse) {
      for (const reservation of describeInstancesResponse.Reservations ?? []) {
        for (const instance of reservation.Instances ?? []) {
          if (instance.InstanceId === instanceId) {
            diagnostics.instanceState = instance.State?.Name;
            diagnostics.stateReason = instance.StateReason?.Message;
            diagnostics.transitionReason = instance.StateTransitionReason;
            diagnostics.launchTime = instance.LaunchTime ? instance.LaunchTime.toISOString() : undefined;
          }
        }
      }
    }

    const describeInstanceStatusResponse = yield* Effect.tryPromise({
      try: () =>
        client.send(
          new DescribeInstanceStatusCommand({
            IncludeAllInstances: true,
            InstanceIds: [instanceId],
          }),
        ),
      catch: (error) => toDiagnosticsLookupError('describe EC2 status checks', instanceId, error),
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    const status = describeInstanceStatusResponse?.InstanceStatuses?.find((item) => item.InstanceId === instanceId);
    if (status) {
      diagnostics.systemStatus = status.SystemStatus?.Status;
      diagnostics.instanceStatus = status.InstanceStatus?.Status;
      diagnostics.events = (status.Events ?? [])
        .map((event) => {
          const code = event.Code?.trim();
          const description = event.Description?.trim();
          if (code && description) {
            return `${code}: ${description}`;
          }
          return code || description || undefined;
        })
        .filter((value): value is string => value !== undefined);
    }

    const consoleOutputResponse = yield* Effect.tryPromise({
      try: () =>
        client.send(
          new GetConsoleOutputCommand({
            InstanceId: instanceId,
            Latest: true,
          }),
        ),
      catch: (error) => toDiagnosticsLookupError('fetch EC2 console output', instanceId, error),
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    diagnostics.consoleOutputExcerpt = toConsoleOutputExcerpt(consoleOutputResponse?.Output);

    return diagnostics;
  });

const buildWaiterFailureMessage = (
  waiterDetails: string,
  diagnostics: InstanceDiagnostics,
): string => {
  const diagnosticDetails = formatInstanceDiagnostics(diagnostics);
  return diagnosticDetails ? `${waiterDetails}, latest snapshot: ${diagnosticDetails}` : waiterDetails;
};

const waitForInstanceRunning = (
  client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(
      `Waiting for EC2 instance ${instanceId} in ${region} to become running (timeout ${startWaitTimeoutMs}ms)`,
    );

    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceRunning(
          {
            client,
            maxWaitTime: toWaitSeconds(startWaitTimeoutMs),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: toWaiterError,
    }).pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
          return yield* new Ec2SsmCycleError({
            message: `Failed while waiting for instance ${instanceId} to become running: ${buildWaiterFailureMessage(
              error.message,
              diagnostics,
            )}`,
            cause: error.cause ?? error,
          });
        }),
      ),
    );

    if (waiter.state !== 'SUCCESS') {
      const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
      return yield* new Ec2SsmCycleError({
        message: `Failed while waiting for instance ${instanceId} to become running: ${buildWaiterFailureMessage(
          formatWaiterError(waiter),
          diagnostics,
        )}`,
      });
    }

    yield* Effect.logInfo(`EC2 instance ${instanceId} is running`);
  });

const waitForInstanceStopped = (
  client: EC2Client,
  region: string,
  instanceId: string,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(
      `Waiting for EC2 instance ${instanceId} in ${region} to stop (timeout ${stopWaitTimeoutMs}ms)`,
    );

    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceStopped(
          {
            client,
            maxWaitTime: toWaitSeconds(stopWaitTimeoutMs),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: toWaiterError,
    }).pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
          return yield* new Ec2SsmCycleError({
            message: `Failed while waiting for instance ${instanceId} to stop: ${buildWaiterFailureMessage(
              error.message,
              diagnostics,
            )}`,
            cause: error.cause ?? error,
          });
        }),
      ),
    );

    if (waiter.state !== 'SUCCESS') {
      const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
      return yield* new Ec2SsmCycleError({
        message: `Failed while waiting for instance ${instanceId} to stop: ${buildWaiterFailureMessage(
          formatWaiterError(waiter),
          diagnostics,
        )}`,
      });
    }

    yield* Effect.logInfo(`EC2 instance ${instanceId} is stopped`);
  });

const getInstanceState = (
  client: EC2Client,
  region: string,
  instanceId: string,
): Effect.Effect<Ec2InstanceStateName, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to describe EC2 instance ${instanceId} in ${region}: ${String(error)}`,
          cause: error,
        }),
    });

    for (const reservation of response.Reservations ?? []) {
      for (const instance of reservation.Instances ?? []) {
        if (instance.InstanceId === instanceId) {
          return instance.State?.Name ?? 'unknown';
        }
      }
    }

    return yield* new Ec2SsmCycleError({
      message: `Could not resolve EC2 instance ${instanceId} in ${region}`,
    });
  });

const startInstance = (
  client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Starting EC2 instance ${instanceId}`);
    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to start instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    yield* waitForInstanceRunning(client, region, instanceId, startWaitTimeoutMs);
  });

const runBootstrapShutdownCycle = (
  client: EC2Client,
  region: string,
  instanceId: string,
  waitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Starting EC2 instance ${instanceId} for expected bootstrap shutdown`);
    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to start instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    yield* Effect.logInfo(
      `Waiting for EC2 instance ${instanceId} in ${region} to complete its expected bootstrap shutdown ` +
        `(timeout ${waitTimeoutMs}ms)`,
    );

    const startedAt = Date.now();
    let sawStartedState = false;
    let lastObservedState: Ec2InstanceStateName | undefined;

    while (Date.now() - startedAt <= waitTimeoutMs) {
      const state = yield* getInstanceState(client, region, instanceId);

      if (state !== lastObservedState) {
        yield* Effect.logInfo(`EC2 instance ${instanceId} bootstrap cycle state=${state}`);
        lastObservedState = state;
      }

      if (state === 'pending' || state === 'running' || state === 'stopping') {
        sawStartedState = true;
      }

      if (state === 'stopped' && sawStartedState) {
        yield* Effect.logInfo(`EC2 instance ${instanceId} completed its expected bootstrap shutdown`);
        return;
      }

      if (state === 'shutting-down' || state === 'terminated') {
        const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
        return yield* new Ec2SsmCycleError({
          message:
            `Instance ${instanceId} entered terminal state ${state} during expected bootstrap shutdown` +
            (formatInstanceDiagnostics(diagnostics) ? `: ${formatInstanceDiagnostics(diagnostics)}` : ''),
        });
      }

      if (state === 'unknown') {
        const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
        return yield* new Ec2SsmCycleError({
          message:
            `Instance ${instanceId} entered an unknown state during expected bootstrap shutdown` +
            (formatInstanceDiagnostics(diagnostics) ? `: ${formatInstanceDiagnostics(diagnostics)}` : ''),
        });
      }

      yield* Effect.sleep(Duration.millis(BOOTSTRAP_POLL_INTERVAL_MS));
    }

    const diagnostics = yield* describeInstanceDiagnostics(client, instanceId);
    return yield* new Ec2SsmCycleError({
      message:
        `Timed out while waiting for instance ${instanceId} to complete its expected bootstrap shutdown` +
        (lastObservedState ? `; last observed state=${lastObservedState}` : '') +
        (formatInstanceDiagnostics(diagnostics) ? `; latest snapshot: ${formatInstanceDiagnostics(diagnostics)}` : ''),
    });
  });

export const startInstanceIfNeeded = (
  client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
  expectBootstrapShutdown = false,
): Effect.Effect<StartedInstance, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const state = yield* getInstanceState(client, region, instanceId);
    yield* Effect.logInfo(`EC2 instance ${instanceId} current state=${state}`);

    if (state === 'running') {
      return { startedByExecutor: false };
    }

    if (state === 'pending') {
      yield* waitForInstanceRunning(client, region, instanceId, startWaitTimeoutMs);
      return { startedByExecutor: false };
    }

    if (state === 'stopping') {
      yield* Effect.logInfo(`EC2 instance ${instanceId} is stopping; waiting for it to stop before restarting`);
      yield* waitForInstanceStopped(client, region, instanceId, startWaitTimeoutMs);
    } else if (state === 'shutting-down' || state === 'terminated') {
      return yield* new Ec2SsmCycleError({
        message: `Instance ${instanceId} cannot be started from state ${state}`,
      });
    } else if (state === 'unknown') {
      return yield* new Ec2SsmCycleError({
        message: `Instance ${instanceId} is in an unknown state and cannot be started safely`,
      });
    }

    if (expectBootstrapShutdown) {
      yield* runBootstrapShutdownCycle(client, region, instanceId, startWaitTimeoutMs);
    }

    yield* startInstance(client, region, instanceId, startWaitTimeoutMs);

    return { startedByExecutor: true };
  });

export const stopInstance = (
  client: EC2Client,
  region: string,
  instanceId: string,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.logInfo(`Stopping EC2 instance ${instanceId}`);
    yield* Effect.tryPromise({
      try: () => client.send(new StopInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to stop instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    yield* waitForInstanceStopped(client, region, instanceId, stopWaitTimeoutMs);
  });
