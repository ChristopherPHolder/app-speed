import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('esbuild-meta', () => {

  it('should show help', () => {
    const helpOutput = execSync('npx esbuild-meta --help').toString();
    expect(execSync('npx esbuild-meta -h').toString()).toBe(helpOutput);
    expect(helpOutput).toMatchSnapshot();
  });


});
