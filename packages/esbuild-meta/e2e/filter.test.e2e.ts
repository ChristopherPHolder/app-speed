import { describe, expect, it } from 'vitest';
import { cliProcess } from './utils.js';
import { DEMAND_STATS_PATH } from '../src/lib/filter-meta.js';
import { INVALID_FILE_PATH_ERROR_MSG } from '../src/lib/utils.js';

describe('filter command', () => {
  it('should have a help option', async () => {
    const { stdout, stderr, code } = await cliProcess('esbuild-meta filter --help');
    expect(stdout).toMatchSnapshot();
    expect(stderr).toBeFalsy();
    expect(code).toBe(0);
  });

  it('should demand stats path option', async () => {
    const { stdout, stderr, code } = await cliProcess('esbuild-meta filter');
    expect(stderr).toContain(DEMAND_STATS_PATH);
    expect(stdout).toBeFalsy();
    expect(code).toBe(1);
  });

  it('should throw if stats path does not point to a file', async () => {
    const INVALID_STATS_FILE = 'invalid-path.json';
    const { stdout, stderr, code } = await cliProcess(`esbuild-meta filter --statsPath ${INVALID_STATS_FILE}`);
    expect(stderr).toContain(INVALID_FILE_PATH_ERROR_MSG('invalid-path.json'));
    expect(stdout).toBeFalsy();
    expect(code).toBe(1);
  });
});
