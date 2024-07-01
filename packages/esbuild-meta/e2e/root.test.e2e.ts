import { describe, it, expect, beforeAll } from 'vitest';
import { version } from '../package.json';

import { commandOutput } from './utils.js';

describe('--help', () => {
  let helpOutput: string;

  beforeAll(() => {
    helpOutput = commandOutput('esbuild-meta --help');
  });

  it('should show help', () => {
    expect(helpOutput).toMatchSnapshot();
  });

  it('should alias to -h', () => {
    expect(commandOutput('esbuild-meta -h')).toBe(helpOutput);
  });
});

describe('--version', () => {
  it('should show version', () => {
    expect(commandOutput('esbuild-meta --version')).toContain(version);
  });
});
