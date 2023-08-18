import yargs from 'yargs';
import { createAuditQueue, UserFlowExecutor } from '@ufo/cli-middleware';
import { AuditExecutor, AuditQueue, AuditStore } from '@ufo/cli-interfaces';

const userFlowHandler = async (args: yargs.ArgumentsCamelCase ) => {
  const queuePath = args.q as string;
  const auditQueue: AuditQueue = await createAuditQueue(queuePath);
  const auditStore = {} as AuditStore;
  const audit: AuditExecutor = new UserFlowExecutor(auditQueue, auditStore);
  await audit.exec();
};

export const userFlowCommand: yargs.CommandModule = {
  command: 'user-flow',
  describe: 'Load, Run and Store user-flow audits',
  aliases: 'uf',
  handler: userFlowHandler
}
