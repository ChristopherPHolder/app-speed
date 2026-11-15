import { EventEmitter } from 'node:events';
import alchemy from './executor';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn }));

const run = async (options: Parameters<typeof alchemy>[0], exitCode = 0) => {
  const child = new EventEmitter();
  spawn.mockReturnValueOnce(child);
  const result = alchemy(options, { root: '/workspace' });
  child.emit('close', exitCode);
  return await result;
};

it('deploys the stack at the stage without prompting', async () => {
  expect(await run({ stack: 'tools/aws-deploy/src/stacks/portal.ts', stage: 'production' })).toEqual({
    success: true,
  });
  expect(spawn).toHaveBeenLastCalledWith(
    '/workspace/node_modules/.bin/alchemy',
    ['deploy', '--config', 'tools/aws-deploy/src/stacks/portal.ts', '--stage', 'production', '--yes'],
    expect.objectContaining({ cwd: '/workspace', stdio: 'inherit' }),
  );
});

it('plans without applying', async () => {
  await run({ stack: 'tools/aws-deploy/src/stacks/api.ts', stage: 'development', command: 'plan', force: true });
  expect(spawn.mock.lastCall?.[1]).toEqual([
    'plan',
    '--config',
    'tools/aws-deploy/src/stacks/api.ts',
    '--stage',
    'development',
  ]);
});

it('forces a deploy that would otherwise be a no-op', async () => {
  await run({ stack: 'tools/aws-deploy/src/stacks/api.ts', stage: 'development', force: true });
  expect(spawn.mock.lastCall?.[1]).toContain('--force');
});

it('turns off Alchemy telemetry', async () => {
  await run({ stack: 'tools/aws-deploy/src/stacks/api.ts', stage: 'development' });
  expect(spawn.mock.lastCall?.[2].env).toMatchObject({ ALCHEMY_TELEMETRY_DISABLED: '1' });
});

it('fails when the deploy fails', async () => {
  expect(await run({ stack: 'tools/aws-deploy/src/stacks/api.ts', stage: 'production' }, 1)).toEqual({
    success: false,
  });
});
