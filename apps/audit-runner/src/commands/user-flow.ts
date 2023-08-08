import yargs from 'yargs';
import { createAuditQueue } from '@ufo/cli-middleware';
import { verbose } from '../args/verbose';

const userFlowBuilder: yargs.CommandBuilder = {
  verbose
}

const userFlowHandler = async (args: yargs.ArgumentsCamelCase ) => {
  console.info('user-flow Args: ', args);
  const auditQueue = await createAuditQueue('');
  await auditQueue.nextItem();
}

export const userFlowCommand: yargs.CommandModule = {
  command: 'user-flow',
  describe: 'Load, Run and Store user-flow audits',
  aliases: 'uf',
  builder: userFlowBuilder,
  handler: userFlowHandler
}
