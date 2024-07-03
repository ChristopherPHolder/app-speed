import { describe, it, expect, beforeAll } from 'vitest';
import { version } from '../package.json';

import { cliProcess, CliProcessOutput } from './utils.js';

describe('--help', () => {
  let output: CliProcessOutput;

  beforeAll(async () => {
    output = await cliProcess('esbuild-meta --help');
  });

  it('should show help', async () => {
    const { stdout, stderr, code } = output;
    expect(stdout).toMatchSnapshot();
    expect(stderr).toBeFalsy();
    expect(code).toBe(0);
  });

  it('should alias to -h', async () => {
    expect(await cliProcess('esbuild-meta --help')).toEqual(output);
  });
});

describe('--version', () => {
  it('should show version', async () => {
    const {stdout, stderr, code} = await cliProcess('esbuild-meta --version');
    expect(stdout).toContain(version);
    expect(stderr).toBeFalsy();
    expect(code).toBe(0);
  });
});
