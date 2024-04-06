import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

import { getCliPath } from '../utils';

const helpOutput = {
  headers: [
    'audit-runner',
    'Commands:',
    'Options:',
  ],
  commands: [
    'audit-runner user-flow  Load, Run and Store user-flow audits',
  ],
  options: [
    '--version  Show version number',
    '-v, --verbose  Run with verbose logging',
    '-h, --help     Show help'
  ]
}

describe('help argument', () => {
  const cliPath = getCliPath();
  const execPath = `node ${cliPath}`;

  function commandOutput(args: string): string {
    return execSync(`${execPath} ${args}`).toString()
  }

  function expectHelpLog(commandOutput: string): void {
    helpOutput.headers.forEach(header => expect(commandOutput).toContain(header));
    helpOutput.commands.forEach(commands => expect(commandOutput).toContain(commands));
    helpOutput.options.forEach(options => expect(commandOutput).toContain(options));
  }

  it('should print a help message', () => {
    expectHelpLog(commandOutput('--help'));
    expectHelpLog(commandOutput('--help true'));
    expectHelpLog(commandOutput('-h'));
    expectHelpLog(commandOutput('-h true'));
  });
  it('should print a help command with and error message', () => {
    let errorMessage = '';
    try {
      commandOutput('');
    } catch (e) {
      if (e instanceof Error) {
        errorMessage = e.message;
      }
    }
    expectHelpLog(errorMessage);
    expect(errorMessage).toContain('Not enough non-option arguments: got 0, need at least 1');
  })
});
