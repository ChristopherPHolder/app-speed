import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

import { getCliPath } from '../utils';

describe('user-flow command', () => {
  const cliPath = getCliPath();
  const execPath = `node ${cliPath}`;

  function commandOutput(args: string): string {
    return execSync(`${execPath} ${args}`).toString()
  }

  it('should print a help message', () => {
    const u = commandOutput(`uf --queue local --dry-run`);
    expect(u).toBe('');
  });
});
