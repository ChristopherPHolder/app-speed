import { waitUntilCommandExecuted } from '@aws-sdk/client-ssm';
import type { SSMClient } from '@aws-sdk/client-ssm';
import { waitForSsmCommandCompletion } from './ssm';

vi.mock('@aws-sdk/client-ssm', () => {
  class GetCommandInvocationCommand {
    constructor(readonly input: unknown) {}
  }

  return {
    GetCommandInvocationCommand,
    waitUntilCommandExecuted: vi.fn(),
  };
});

const waitUntilCommandExecutedMock = vi.mocked(waitUntilCommandExecuted);

describe('waitForSsmCommandCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes stderr details for failed invocations', async () => {
    waitUntilCommandExecutedMock.mockResolvedValue({ state: 'FAILURE' } as never);

    const client = {
      send: vi.fn().mockResolvedValue({
        StatusDetails: 'Failed',
        ResponseCode: 125,
        StandardErrorContent: 'docker pull failed: no space left on device',
        StandardOutputContent: '',
      }),
    } as unknown as SSMClient;

    const result = await waitForSsmCommandCompletion(client, 'cmd-123', ['i-123'], 900000, 5000);

    expect(result.success).toBe(false);
    expect(result.message).toContain('SSM command cmd-123 failed');
    expect(result.message).toContain('i-123=Failed');
    expect(result.message).toContain('exit=125');
    expect(result.message).toContain('stderr="docker pull failed: no space left on device"');
  });

  it('includes current status and stdout when the invocation times out', async () => {
    waitUntilCommandExecutedMock.mockRejectedValue(new Error('timed out'));

    const client = {
      send: vi.fn().mockResolvedValue({
        StatusDetails: 'InProgress',
        ResponseCode: -1,
        StandardErrorContent: '',
        StandardOutputContent: 'Pulling fs layer Pulling fs layer Download complete',
      }),
    } as unknown as SSMClient;

    const result = await waitForSsmCommandCompletion(client, 'cmd-456', ['i-456'], 900000, 5000);

    expect(result.success).toBe(false);
    expect(result.message).toContain('SSM command cmd-456 timed out after 900000ms');
    expect(result.message).toContain('i-456=InProgress');
    expect(result.message).toContain('stdout="Pulling fs layer Pulling fs layer Download complete"');
  });
});
