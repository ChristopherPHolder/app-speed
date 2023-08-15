import yargs from 'yargs';
import { createAuditQueue } from '@ufo/cli-middleware';
import { AuditQueue } from '@ufo/cli-interfaces';

const userFlowHandler = async (args: yargs.ArgumentsCamelCase ) => {
  console.info('user-flow Args: ', args);

  const queuePath = args.q as string;
  const auditQueue: AuditQueue = await createAuditQueue(queuePath);
  let item = await auditQueue.nextItem();
  while(item) {
    console.log('While Item', item);
    item = await auditQueue.nextItem();
  }
}

export const userFlowCommand: yargs.CommandModule = {
  command: 'user-flow',
  describe: 'Load, Run and Store user-flow audits',
  aliases: 'uf',
  handler: userFlowHandler
}
