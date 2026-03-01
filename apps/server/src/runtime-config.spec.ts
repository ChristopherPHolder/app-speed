import { ConfigProvider, Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { resolveRunnerManagerMode } from './runtime-config.js';

const runMode = (entries: ReadonlyArray<readonly [string, string]>) =>
  Effect.runPromise(
    resolveRunnerManagerMode.pipe(
      Effect.withConfigProvider(ConfigProvider.fromMap(new Map(entries))),
    ),
  );

describe('resolveRunnerManagerMode', () => {
  it('defaults to aws when mode is not configured', async () => {
    await expect(runMode([])).resolves.toBe('aws');
  });

  it('supports explicit local mode', async () => {
    await expect(runMode([['RUNNER_MANAGER_MODE', 'local']])).resolves.toBe('local');
  });

  it('accepts explicit aws mode', async () => {
    await expect(runMode([['RUNNER_MANAGER_MODE', 'aws']])).resolves.toBe('aws');
  });
});
