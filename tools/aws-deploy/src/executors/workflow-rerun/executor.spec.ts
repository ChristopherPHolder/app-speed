import { EventEmitter } from 'node:events';
import type { ExecutorContext } from '@nx/devkit';
import workflowRerun from './executor';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn }));
const context: Pick<ExecutorContext, 'root'> = { root: '/workspace' };

it.each([false, true])('retries the selected workflow via gh (failedOnly=%s)', async (failedOnly) => {
  const child = new EventEmitter();
  spawn.mockImplementationOnce(() => child);
  const result = workflowRerun({ runId: 123, failedOnly }, context);
  child.emit('close', 0);
  expect(await result).toEqual({ success: true });
  expect(spawn).toHaveBeenLastCalledWith('gh', ['run', 'rerun', '123', ...(failedOnly ? ['--failed'] : [])], {
    cwd: context.root,
    stdio: 'inherit',
  });
});

it('rejects invalid run IDs before starting gh', async () => {
  await expect(workflowRerun({ runId: -1 }, context)).rejects.toThrow('runId');
});
