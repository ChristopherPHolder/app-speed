import executor from './executor';

afterEach(() => vi.unstubAllEnvs());

it.each(['', '   '])('rejects empty Docker environment passthrough before contacting SSM', async (value) => {
  vi.stubEnv('RUNNER_API_TOKEN', value);
  await expect(
    executor({
      region: 'eu-central-1',
      instanceIds: ['i-test'],
      imageRef: 'registry.example.com/api:test',
      additionalRunArgs: ['-e RUNNER_API_TOKEN'],
    }),
  ).rejects.toThrow('Missing environment variable RUNNER_API_TOKEN');
});
