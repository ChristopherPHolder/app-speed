import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

const executorUrls = [
  new URL('./executors/ec2-ssm-cycle/executor.ts', import.meta.url).href,
  new URL('./executors/s3-upload/executor.ts', import.meta.url).href,
  new URL('./executors/ssm-deploy/executor.ts', import.meta.url).href,
];

describe('native TypeScript executor loading', () => {
  it('loads every executor using Node type stripping', () => {
    const script = `
      if (process.features.typescript !== 'strip') {
        throw new Error('Node native TypeScript stripping is unavailable');
      }
      for (const executorUrl of ${JSON.stringify(executorUrls)}) {
        await import(executorUrl);
      }
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
  });
});
