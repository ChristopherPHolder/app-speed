#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { userFlowCommand } from './commands';
import { verbose, help, dryRun, shutdown } from './args';
import { execSync } from 'node:child_process';

const argv = await yargs(hideBin(process.argv))
  .command([ userFlowCommand ])
  .options({ verbose, help, shutdown, dryRun })
  .parse();

if (argv.shutdown === true) {
  execSync('shutdown -h -t 5 & exit 0', { shell: '/bin/bash' });
}
