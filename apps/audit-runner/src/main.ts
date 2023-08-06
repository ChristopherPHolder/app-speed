#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const i = await yargs(hideBin(process.argv))
  .command(
    'user-flow', 'run user-flow and store results',
    () => {},
    (argv) => {console.info('Handler', argv)}
  )
  .alias('h', 'help')
  .option('verbose', { alias: 'v', type: 'boolean', description: 'Run with verbose logging' })
  .demandCommand(1)
  .parse();

const { default: factory } = await import('./utils/queue');

const auditQueue =  await factory.createAuditQueue('')
