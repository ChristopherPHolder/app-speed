import {
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  waitUntilInstanceRunning,
  waitUntilInstanceStopped,
} from '@aws-sdk/client-ec2';
import type { EC2Client } from '@aws-sdk/client-ec2';
import { Effect } from 'effect';

import { startInstanceIfNeeded, stopInstance } from './ec2';

vi.mock('@aws-sdk/client-ec2', () => {
  class DescribeInstancesCommand {
    constructor(readonly input: unknown) {}
  }

  class DescribeInstanceStatusCommand {
    constructor(readonly input: unknown) {}
  }

  class StartInstancesCommand {
    constructor(readonly input: unknown) {}
  }

  class StopInstancesCommand {
    constructor(readonly input: unknown) {}
  }

  return {
    DescribeInstancesCommand,
    DescribeInstanceStatusCommand,
    StartInstancesCommand,
    StopInstancesCommand,
    waitUntilInstanceRunning: vi.fn(),
    waitUntilInstanceStopped: vi.fn(),
  };
});

const waitUntilInstanceRunningMock = vi.mocked(waitUntilInstanceRunning);
const waitUntilInstanceStoppedMock = vi.mocked(waitUntilInstanceStopped);

describe('ec2-ssm-cycle ec2 helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('waits for a stopping instance to stop before starting it again', async () => {
    const send = vi.fn().mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeInstancesCommand) {
        return {
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-123',
                  State: { Name: 'stopping' },
                },
              ],
            },
          ],
        };
      }

      if (command instanceof DescribeInstanceStatusCommand) {
        return { InstanceStatuses: [] };
      }

      if (command instanceof StartInstancesCommand) {
        return {};
      }

      throw new Error(`Unexpected command: ${String(command)}`);
    });

    const client = { send } as unknown as EC2Client;

    waitUntilInstanceStoppedMock.mockResolvedValue({ state: 'SUCCESS' } as never);
    waitUntilInstanceRunningMock.mockResolvedValue({ state: 'SUCCESS' } as never);

    const result = await Effect.runPromise(startInstanceIfNeeded(client, 'eu-central-1', 'i-123', 60_000));

    expect(result).toEqual({ startedByExecutor: true });
    expect(waitUntilInstanceStoppedMock).toHaveBeenCalledTimes(1);
    expect(waitUntilInstanceRunningMock).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(expect.any(StartInstancesCommand));
  });

  it('waits for pending instances to become running without starting them again', async () => {
    const send = vi.fn().mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeInstancesCommand) {
        return {
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-123',
                  State: { Name: 'pending' },
                },
              ],
            },
          ],
        };
      }

      if (command instanceof DescribeInstanceStatusCommand) {
        return { InstanceStatuses: [] };
      }

      throw new Error(`Unexpected command: ${String(command)}`);
    });

    const client = { send } as unknown as EC2Client;

    waitUntilInstanceRunningMock.mockResolvedValue({ state: 'SUCCESS' } as never);

    const result = await Effect.runPromise(startInstanceIfNeeded(client, 'eu-central-1', 'i-123', 60_000));

    expect(result).toEqual({ startedByExecutor: false });
    expect(waitUntilInstanceRunningMock).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalledWith(expect.any(StartInstancesCommand));
  });

  it('reports waiter failures with the observed instance state', async () => {
    const send = vi.fn().mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeInstancesCommand) {
        return {
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-123',
                  State: { Name: 'pending' },
                },
              ],
            },
          ],
        };
      }

      if (command instanceof DescribeInstanceStatusCommand) {
        return { InstanceStatuses: [] };
      }

      if (command instanceof StopInstancesCommand) {
        return {};
      }

      throw new Error(`Unexpected command: ${String(command)}`);
    });

    const client = { send } as unknown as EC2Client;

    waitUntilInstanceRunningMock.mockRejectedValue({
      state: 'FAILURE',
      reason: {
        Reservations: [
          {
            Instances: [
              {
                State: { Name: 'stopping' },
                StateReason: { Message: 'Client.UserInitiatedShutdown: User initiated shutdown' },
                StateTransitionReason: 'User initiated (2026-03-13 08:04:36 GMT)',
              },
            ],
          },
        ],
      },
    });

    await expect(Effect.runPromise(startInstanceIfNeeded(client, 'eu-central-1', 'i-123', 60_000))).rejects.toThrow(
      'Failed while waiting for instance i-123 to become running: waiter state=FAILURE, instance state=stopping',
    );
  });

  it('reports timeout failures with a latest EC2 snapshot', async () => {
    const send = vi.fn().mockImplementation(async (command: unknown) => {
      if (command instanceof DescribeInstancesCommand) {
        return {
          Reservations: [
            {
              Instances: [
                {
                  InstanceId: 'i-123',
                  State: { Name: 'pending' },
                  StateReason: { Message: 'Instance is still booting' },
                  StateTransitionReason: 'User initiated (2026-03-13 08:04:36 GMT)',
                  LaunchTime: new Date('2026-03-13T08:04:33.000Z'),
                },
              ],
            },
          ],
        };
      }

      if (command instanceof DescribeInstanceStatusCommand) {
        return {
          InstanceStatuses: [
            {
              InstanceId: 'i-123',
              SystemStatus: { Status: 'initializing' },
              InstanceStatus: { Status: 'initializing' },
              Events: [{ Code: 'instance-reboot', Description: 'Instance reboot scheduled' }],
            },
          ],
        };
      }

      throw new Error(`Unexpected command: ${String(command)}`);
    });

    const client = { send } as unknown as EC2Client;

    waitUntilInstanceRunningMock.mockResolvedValue({
      state: 'TIMEOUT',
      observedResponses: { '200: OK': 8 },
    } as never);

    await expect(Effect.runPromise(startInstanceIfNeeded(client, 'eu-central-1', 'i-123', 60_000))).rejects.toThrow(
      'Failed while waiting for instance i-123 to become running: waiter state=TIMEOUT, observed responses=200: OK x8, latest snapshot: instance state=pending, state reason=Instance is still booting, transition reason=User initiated (2026-03-13 08:04:36 GMT), system status=initializing, instance status=initializing',
    );
  });

  it('waits for stop completion after issuing StopInstancesCommand', async () => {
    const send = vi.fn().mockImplementation(async (command: unknown) => {
      if (command instanceof StopInstancesCommand) {
        return {};
      }

      throw new Error(`Unexpected command: ${String(command)}`);
    });

    const client = { send } as unknown as EC2Client;
    waitUntilInstanceStoppedMock.mockResolvedValue({ state: 'SUCCESS' } as never);

    await Effect.runPromise(stopInstance(client, 'eu-central-1', 'i-123', 60_000));

    expect(waitUntilInstanceStoppedMock).toHaveBeenCalledTimes(1);
  });
});
