import { EC2Client } from '@aws-sdk/client-ec2';
import { HttpClient, HttpClientResponse } from '@effect/platform';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { stopInstanceMock } = vi.hoisted(() => ({
  stopInstanceMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-ec2', () => ({
  EC2Client: vi.fn().mockImplementation(() => ({ send: stopInstanceMock })),
  StopInstancesCommand: vi.fn().mockImplementation((input: unknown) => input),
}));

const provideHttpClient = (payload: { ok: true; shouldTerminate: boolean }) =>
  Effect.provideService(
    HttpClient.HttpClient,
    HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    ),
  );

describe('requestRunnerTermination', () => {
  beforeEach(() => {
    vi.resetModules();
    stopInstanceMock.mockReset();
    stopInstanceMock.mockResolvedValue({});
    process.env['RUNNER_API_BASE_URL'] = 'http://runner.test/api';
    process.env['RUNNER_ID'] = 'ec2-i-0123456789abcdef0';
    process.env['AWS_REGION'] = 'eu-central-1';
  });

  afterEach(() => {
    delete process.env['RUNNER_API_BASE_URL'];
    delete process.env['RUNNER_ID'];
    delete process.env['AWS_REGION'];
  });

  it('attempts direct EC2 self-termination after shutdown is approved', async () => {
    const { requestRunnerTermination } = await import('./control-plane.effect');

    const shouldTerminate = await Effect.runPromise(
      requestRunnerTermination('IDLE_TIMEOUT').pipe(provideHttpClient({ ok: true, shouldTerminate: true })),
    );

    expect(shouldTerminate).toBe(true);
    expect(vi.mocked(EC2Client)).toHaveBeenCalledWith({ region: 'eu-central-1' });
    expect(stopInstanceMock).toHaveBeenCalledTimes(1);
    expect(stopInstanceMock).toHaveBeenCalledWith({
      InstanceIds: ['i-0123456789abcdef0'],
    });
  });

  it('does not self-terminate when the server rejects shutdown', async () => {
    const { requestRunnerTermination } = await import('./control-plane.effect');

    const shouldTerminate = await Effect.runPromise(
      requestRunnerTermination('IDLE_TIMEOUT').pipe(provideHttpClient({ ok: true, shouldTerminate: false })),
    );

    expect(shouldTerminate).toBe(false);
    expect(stopInstanceMock).not.toHaveBeenCalled();
  });
});
