import { EventEmitter } from 'node:events';
import workflowDispatch from './executor';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn }));

it('dispatches the explicit workflow ref and environment through gh', async () => {
  const child = new EventEmitter();
  spawn.mockReturnValueOnce(child);
  const result = workflowDispatch(
    { workflow: 'deploy-api.yml', ref: 'fix/deploy', environment: 'production' },
    { root: '/workspace' },
  );
  child.emit('close', 0);
  expect(await result).toEqual({ success: true });
  expect(spawn).toHaveBeenLastCalledWith(
    'gh',
    ['workflow', 'run', 'deploy-api.yml', '--ref', 'fix/deploy', '-f', 'environment=production'],
    { cwd: '/workspace', stdio: 'inherit' },
  );
});
