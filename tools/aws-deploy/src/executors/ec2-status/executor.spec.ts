import executor from './executor';
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-ec2', () => ({
  EC2Client: class {
    send = send;
  },
  DescribeInstancesCommand: class {
    constructor(readonly input: unknown) {}
  },
  DescribeInstanceStatusCommand: class {
    constructor(readonly input: unknown) {}
  },
}));
it('reports a stopped or stopping worker without changing its lifecycle', async () => {
  send.mockResolvedValueOnce({
    Reservations: [{ Instances: [{ InstanceId: 'i-test', State: { Name: 'stopping' } }] }],
  });
  send.mockResolvedValueOnce({ InstanceStatuses: [] });
  const output = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  expect(await executor({ region: 'eu-central-1', instanceId: 'i-test' })).toEqual({ success: true });
  expect(output).toHaveBeenCalledWith(JSON.stringify({ instanceId: 'i-test', state: 'stopping' }));
  expect(send).toHaveBeenCalledTimes(2);
  output.mockRestore();
});
