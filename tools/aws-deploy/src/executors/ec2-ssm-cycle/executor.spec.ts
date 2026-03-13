import { Effect } from 'effect';
import { waitForSsmCommandCompletion } from '../../lib/ssm';
import { startInstanceIfNeeded, stopInstance } from './ec2';
import executor from './executor';

const {
  ec2ClientSendMock,
  ssmClientSendMock,
  startInstanceIfNeededMock,
  stopInstanceMock,
  waitForSsmCommandCompletionMock,
} = vi.hoisted(() => ({
  ec2ClientSendMock: vi.fn(),
  ssmClientSendMock: vi.fn(),
  startInstanceIfNeededMock: vi.fn(),
  stopInstanceMock: vi.fn(),
  waitForSsmCommandCompletionMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-ec2', () => {
  class EC2Client {
    send = ec2ClientSendMock;
  }

  return {
    EC2Client,
  };
});

vi.mock('@aws-sdk/client-ssm', () => {
  class SSMClient {
    send = ssmClientSendMock;
  }

  class SendCommandCommand {
    constructor(readonly input: unknown) {}
  }

  return {
    SSMClient,
    SendCommandCommand,
  };
});

vi.mock('../../lib/ssm', () => ({
  waitForSsmCommandCompletion: waitForSsmCommandCompletionMock,
}));

vi.mock('./ec2', () => ({
  startInstanceIfNeeded: startInstanceIfNeededMock,
  stopInstance: stopInstanceMock,
}));

describe('ec2-ssm-cycle executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startInstanceIfNeededMock.mockReturnValue(Effect.succeed({ startedByExecutor: true }));
    stopInstanceMock.mockReturnValue(Effect.void);
    ssmClientSendMock.mockResolvedValue({
      Command: {
        CommandId: 'cmd-123',
      },
    });
    vi.mocked(waitForSsmCommandCompletion).mockResolvedValue({
      success: true,
      message: 'ok',
      commandId: 'cmd-123',
    });
  });

  it('runs the runner container with a restart policy so it comes back after EC2 restarts', async () => {
    const result = await executor({
      region: 'eu-central-1',
      instanceId: 'i-123',
      imageRef: '123456789012.dkr.ecr.eu-central-1.amazonaws.com/app-speed/runner:test',
      containerName: 'app-speed-runner',
      additionalRunArgs: ['-e RUNNER_API_BASE_URL=https://dev.appspeed.dev/api'],
      stopAfterCompletion: true,
      stopOnlyIfStarted: true,
    });

    expect(result.success).toBe(true);
    expect(startInstanceIfNeeded).toHaveBeenCalledTimes(1);
    expect(waitForSsmCommandCompletion).toHaveBeenCalledTimes(1);
    expect(stopInstance).toHaveBeenCalledTimes(1);

    const [sendCommand] = ssmClientSendMock.mock.calls[0] ?? [];
    const parameters = (sendCommand as { input?: { Parameters?: Record<string, string[]> } }).input?.Parameters;
    const commands = parameters?.commands ?? [];
    expect(commands).toEqual(
      expect.arrayContaining([
        expect.stringContaining('docker run -d --name \'app-speed-runner\' --restart unless-stopped'),
      ]),
    );
  });
});
