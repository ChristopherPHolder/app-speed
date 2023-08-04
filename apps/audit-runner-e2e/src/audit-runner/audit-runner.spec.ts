import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';

// this is a quick fix, ether implement a proper solution of fix the issue with configs
const getCliPath = (): string => {
  const cwd = process.cwd();
  const rootPath = cwd.includes('audit-runner-e2e') ? '../../' : '';
  return join(process.cwd(), rootPath, 'dist/apps/audit-runner');
};

const helpOutput = {
  headers: [
    'audit-runner',
    'Commands:',
    'Options:',
  ],
  commands: [
    'audit-runner user-flow  run user-flow and store results',
  ],
  options: [
    '--version  Show version number',
    '-v, --verbose  Run with verbose logging',
    '-h, --help     Show help'
  ]
}

describe('CLI tests', () => {
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
