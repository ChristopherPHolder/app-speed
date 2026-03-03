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

const ensureWaiterSuccess = (
  result: WaiterOutput,
  failureMessage: string,
): Effect.Effect<void, Ec2SsmCycleError> =>
  result.state === 'SUCCESS'
    ? Effect.void
    : Effect.fail(new Ec2SsmCycleError({ message: `${failureMessage}: waiter state=${result.state}` }));

const toWaitSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));

const getInstanceState = (
  client: EC2Client,
  region: string,
  instanceId: string,
): Effect.Effect<string, Ec2SsmCycleError> =>
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
    const shouldStart = state !== 'running' && state !== 'pending';

    if (!shouldStart) {
      return { startedByExecutor: false };
    }

    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) =>
        new Ec2SsmCycleError({
          message: `Failed to start instance ${instanceId}: ${String(error)}`,
          cause: error,
        }),
    });

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
          message: `Failed while waiting for instance ${instanceId} to become running: ${String(error)}`,
          cause: error,
        }),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach running state in time`);

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
          message: `Failed while waiting for instance ${instanceId} to stop: ${String(error)}`,
          cause: error,
        }),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach stopped state in time`);
  });
