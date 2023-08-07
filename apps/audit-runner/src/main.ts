#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const i = await yargs(hideBin(process.argv))
  .command(
    'user-flow', 'run user-flow and store results',
    () => {},
    async (argv) => {
      console.info('Handler', argv);
      const { default: factory } = await import('./utils/queue');
      const auditQueue =  await factory.createAuditQueue('dist\\libs\\audit-queue\\index.js');
      await auditQueue.nextItem();
    }
  )
  .alias('h', 'help')
  .option('verbose', { alias: 'v', type: 'boolean', description: 'Run with verbose logging' })
  .demandCommand(1)
  .parse();
