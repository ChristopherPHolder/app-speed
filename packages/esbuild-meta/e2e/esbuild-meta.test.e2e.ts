import { describe, it, expect, beforeAll } from 'vitest';
import { version } from '../package.json';

import { commandOutput } from './utils.js';

describe('--help', () => {
  let helpOutput: string;

  beforeAll(() => {
    helpOutput = commandOutput('npx esbuild-meta --help');
  });

  it('should show help', () => {
    expect(helpOutput).toMatchSnapshot();
  });

  it('should alias to -h', () => {
    expect(commandOutput('npx esbuild-meta -h')).toBe(helpOutput);
  });
});

describe('--version', () => {
  it('should show version', () => {
    expect(commandOutput('npx esbuild-meta --version')).toContain(version);
  });
});
