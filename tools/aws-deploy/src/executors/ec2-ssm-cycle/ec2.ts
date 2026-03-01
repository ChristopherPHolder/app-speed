import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  waitUntilInstanceRunning,
  waitUntilInstanceStopped,
} from '@aws-sdk/client-ec2';
import { Effect } from 'effect';

type WaiterOutput = {
  state: 'ABORTED' | 'FAILURE' | 'SUCCESS' | 'RETRY' | 'TIMEOUT';
};

export type StartedInstance = {
  startedByExecutor: boolean;
};

const ensureWaiterSuccess = (result: WaiterOutput, failureMessage: string): Effect.Effect<void, Error> =>
  result.state === 'SUCCESS' ? Effect.void : Effect.fail(new Error(`${failureMessage}: waiter state=${result.state}`));

const toWaitSeconds = (timeoutMs: number): number => Math.max(1, Math.ceil(timeoutMs / 1000));

const getInstanceState = (client: EC2Client, region: string, instanceId: string): Effect.Effect<string, Error> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => new Error(`Failed to describe EC2 instance ${instanceId} in ${region}: ${String(error)}`),
    });

    for (const reservation of response.Reservations ?? []) {
      for (const instance of reservation.Instances ?? []) {
        if (instance.InstanceId === instanceId) {
          return instance.State?.Name ?? 'unknown';
        }
      }
    }

    return yield* Effect.fail(new Error(`Could not resolve EC2 instance ${instanceId} in ${region}`));
  });

export const startInstanceIfNeeded = (
  client: EC2Client,
  region: string,
  instanceId: string,
  startWaitTimeoutMs: number,
): Effect.Effect<StartedInstance, Error> =>
  Effect.gen(function* () {
    const state = yield* getInstanceState(client, region, instanceId);
    const shouldStart = state !== 'running' && state !== 'pending';

    if (!shouldStart) {
      return { startedByExecutor: false };
    }

    yield* Effect.tryPromise({
      try: () => client.send(new StartInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => new Error(`Failed to start instance ${instanceId}: ${String(error)}`),
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
        new Error(`Failed while waiting for instance ${instanceId} to become running: ${String(error)}`),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach running state in time`);

    return { startedByExecutor: true };
  });

export const stopInstance = (
  client: EC2Client,
  instanceId: string,
  stopWaitTimeoutMs: number,
): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    yield* Effect.tryPromise({
      try: () => client.send(new StopInstancesCommand({ InstanceIds: [instanceId] })),
      catch: (error) => new Error(`Failed to stop instance ${instanceId}: ${String(error)}`),
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
      catch: (error) => new Error(`Failed while waiting for instance ${instanceId} to stop: ${String(error)}`),
    });

    yield* ensureWaiterSuccess(waiter as WaiterOutput, `Instance ${instanceId} did not reach stopped state in time`);
  });
