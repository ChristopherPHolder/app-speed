import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  waitUntilInstanceRunning,
  waitUntilInstanceStopped,
} from '@aws-sdk/client-ec2';
import { Effect } from 'effect';

import { Ec2SsmCycleError } from './errors';

type WaiterOutput = {
  state: 'ABORTED' | 'FAILURE' | 'SUCCESS' | 'RETRY' | 'TIMEOUT';
};

export type StartedInstance = {
  startedByExecutor: boolean;
};

type Ec2InstanceStateName = 'pending' | 'running' | 'shutting-down' | 'terminated' | 'stopping' | 'stopped' | 'unknown';

const ensureWaiterSuccess = (result: WaiterOutput, failureMessage: string): Effect.Effect<void, Ec2SsmCycleError> =>
  result.state === 'SUCCESS'
    ? Effect.void
    : Effect.fail(new Ec2SsmCycleError({ message: `${failureMessage}: waiter state=${result.state}` }));

const toWaitSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getObservedInstanceDetails = (
  error: unknown,
): {
  waiterState?: string;
  instanceState?: string;
  stateReason?: string;
  transitionReason?: string;
} => {
  if (!isRecord(error)) {
    return {};
  }

  const waiterState = typeof error.state === 'string' ? error.state : undefined;
  const reason = isRecord(error.reason) ? error.reason : undefined;
  const reservations = Array.isArray(reason?.Reservations) ? reason.Reservations : [];
  const firstReservation = reservations.find(isRecord);
  const instances = Array.isArray(firstReservation?.Instances) ? firstReservation.Instances : [];
  const firstInstance = instances.find(isRecord);

  const state = isRecord(firstInstance?.State) ? firstInstance.State : undefined;
  const stateReason = isRecord(firstInstance?.StateReason) ? firstInstance.StateReason : undefined;

  return {
    waiterState,
    instanceState: typeof state?.Name === 'string' ? state.Name : undefined,
    stateReason: typeof stateReason?.Message === 'string' ? stateReason.Message : undefined,
    transitionReason:
      typeof firstInstance?.StateTransitionReason === 'string' ? firstInstance.StateTransitionReason : undefined,
  };
};

const formatWaiterError = (error: unknown): string => {
  if (error instanceof Error && error.message && error.message !== '[object Object]') {
    return error.message;
  }

  const details = getObservedInstanceDetails(error);
  const parts = [
    details.waiterState ? `waiter state=${details.waiterState}` : null,
    details.instanceState ? `instance state=${details.instanceState}` : null,
    details.stateReason ? `state reason=${details.stateReason}` : null,
    details.transitionReason ? `transition reason=${details.transitionReason}` : null,
  ].filter((value): value is string => value !== null);

  return parts.length > 0 ? parts.join(', ') : String(error);
};

const waitForInstanceRunning = (
  client: EC2Client,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceRunning(
          {
            client,
            maxWaitTime: toWaitSeconds(startWaitTimeoutMs),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed while waiting for instance ${instanceId} to become running: ${formatWaiterError(error)}`,
          cause: error,
        }),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach running state in time`);
  });

const waitForInstanceStopped = (
  client: EC2Client,
  instanceId: string,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const waiter = yield* Effect.tryPromise({
      try: () =>
        waitUntilInstanceStopped(
          {
            client,
            maxWaitTime: toWaitSeconds(stopWaitTimeoutMs),
          },
          { InstanceIds: [instanceId] },
        ),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed while waiting for instance ${instanceId} to stop: ${formatWaiterError(error)}`,
          cause: error,
        }),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach stopped state in time`);
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

export const startInstanceIfNeeded = (
  client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<StartedInstance, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    const state = yield* getInstanceState(client, region, instanceId);

    if (state === 'running') {
      return { startedByExecutor: false };
    }

    if (state === 'pending') {
      yield* waitForInstanceRunning(client, instanceId, startWaitTimeoutMs);
      return { startedByExecutor: false };
    }

    if (state === 'stopping') {
      yield* waitForInstanceStopped(client, instanceId, startWaitTimeoutMs);
    } else if (state === 'shutting-down' || state === 'terminated') {
      return yield* new Ec2SsmCycleError({
        message: `Instance ${instanceId} cannot be started from state ${state}`,
      });
    } else if (state === 'unknown') {
      return yield* new Ec2SsmCycleError({
        message: `Instance ${instanceId} is in an unknown state and cannot be started safely`,
      });
    }

    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to start instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    yield* waitForInstanceRunning(client, instanceId, startWaitTimeoutMs);

    return { startedByExecutor: true };
  });

export const stopInstance = (
  client: EC2Client,
  instanceId: string,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Ec2SsmCycleError> =>
  Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => client.send(new StopInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to stop instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

    yield* waitForInstanceStopped(client, instanceId, stopWaitTimeoutMs);
  });
