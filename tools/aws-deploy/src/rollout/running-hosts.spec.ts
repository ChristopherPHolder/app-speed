import { rolloutToRunningHosts } from './running-hosts';

afterEach(() => vi.unstubAllEnvs());

it.each(['', '   '])('rejects empty Docker environment passthrough before contacting SSM', async (value) => {
  vi.stubEnv('RUNNER_API_TOKEN', value);
  await expect(
    rolloutToRunningHosts({
      region: 'eu-central-1',
      instanceIds: ['i-test'],
      imageRef: 'registry.example.com/api:test',
      additionalRunArgs: ['-e RUNNER_API_TOKEN'],
    }),
  ).rejects.toThrow('Missing environment variable RUNNER_API_TOKEN');
});
