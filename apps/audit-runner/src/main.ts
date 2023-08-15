#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { userFlowCommand } from './commands/user-flow';
import { verbose } from './args/verbose';
import { help } from './args/help';
import { queue } from './args/queue';

const commands: yargs.CommandModule[] = [ userFlowCommand ];
const options: Record<string, yargs.Options> = { verbose, help, queue };

const cliYargs = yargs(hideBin(process.argv));
commands.forEach(command => cliYargs.command(command));
Object.keys(options).forEach(key => cliYargs.option(key, options[key]));

await cliYargs.demandCommand(1).parse();
