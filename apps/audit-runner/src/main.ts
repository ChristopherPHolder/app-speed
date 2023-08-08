#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { userFlowCommand } from './commands/user-flow';
import { verbose } from './args/verbose';
import { help } from './args/help';

const commands: yargs.CommandModule[] = [userFlowCommand];
const options: yargs.Options[] = [verbose, help];

const cliYargs = yargs(hideBin(process.argv));
commands.forEach(command => cliYargs.command(command));
options.forEach(option => cliYargs.options(Object.keys({option})[0], option))

await cliYargs.demandCommand(1).parse();
